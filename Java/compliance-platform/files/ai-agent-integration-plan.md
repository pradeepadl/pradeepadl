# Python AI Agent SDK — Integration Plan

> **Update (implemented):** LLM provider selection is now DB-backed, not
> hardcoded. Admins pick Claude/Gemini/HuggingFace and save an API key on
> the Integrations page ("AI Model Provider" panel); it's stored encrypted
> (AES-256-GCM) in `tcfg_llm_provider_cfgs`. Agents resolve the active
> provider per request via `InternalLlmConfigController` rather than
> reading an env var. See §9 below for the full design.

Goal: a reusable Python SDK that backs one or more AI-agent microservices,
plugged into the existing Java backend so the flow is:

```
React UI → Java (Spring Boot) → Python (FastAPI + LangGraph agent) → Java → UI
```

Decisions locked in:
- **Delivery pattern**: async job + polling. Java accepts the request, hands
  it to RabbitMQ (already in the stack), returns a `job_id` immediately; the
  UI polls Java for status/result. Avoids HTTP timeouts on multi-step agent
  runs and reuses `spring-boot-starter-amqp` / `spring-integration-amqp`,
  both already dependencies.
- **Agent orchestration**: LangGraph / LangChain, provider-agnostic so the
  underlying model can change without reshaping the agent graphs.

Grounding in what's already in this repo (not a from-scratch design):
- RabbitMQ container already running in `compose.yaml` / `docker-compose.deploy.yml`.
- `spring-security-oauth2-authorization-server` already a pom.xml dependency
  — the natural issuer for service-to-service auth tokens.
- `tlog_process_logs` (from `0010-audit.yaml`) already models exactly this
  shape of thing (correlation_id, event_data/result_data jsonb, status,
  duration_ms) — the new AI job table follows the same convention.
- `tcfg_data_rtntn_plcy` (per-tenant retention policy table) already exists
  — AI job records should be subject to it, since prompts/responses will
  contain KYC/PII data.
- `TSUB_DUPLICATE_IDEMPOTENCY` already establishes an idempotency-guard
  pattern in this schema — reused here for RabbitMQ redelivery safety.
- Frontend currently has **zero** API client code — everything in
  `frontend/src/app/data.ts` is mock data. This is the first real
  frontend↔backend wiring, not an addition to existing plumbing.

---

## 1. Message contract (the JSON that crosses the Java/Python boundary)

**Request** — Java publishes to `ai.agent.requests` (routing key = agent name):
```json
{
  "job_id": "uuid",
  "tenant_id": "uuid",
  "agent_name": "kyc-risk-summarizer",
  "correlation_id": "uuid",
  "requested_by": "user@example.com",
  "context": { "case_id": "uuid", "client_id": "uuid" },
  "input": { "question": "string", "params": {} },
  "submitted_at": "ISO-8601"
}
```

**Response** — Python publishes to `ai.agent.responses`:
```json
{
  "job_id": "uuid",
  "correlation_id": "uuid",
  "status": "COMPLETED | FAILED",
  "output": { "answer": "string", "citations": [], "structured": {} },
  "agent_name": "kyc-risk-summarizer",
  "model": "claude-opus-5",
  "token_usage": { "input": 1200, "output": 340 },
  "duration_ms": 4210,
  "error": null,
  "completed_at": "ISO-8601"
}
```
Both sides validate against this contract with Pydantic (Python) and a Java
DTO (Jackson) — the schema is the actual interface, not the transport.

---

## 2. Python SDK layout (`cddp_ai_sdk`)

A single installable package that every agent microservice depends on,
plus one concrete microservice as the first walking skeleton.

```
ai/
  sdk/                              # cddp_ai_sdk — the reusable package
    cddp_ai_sdk/
      core/
        models.py                   # AgentRequest / AgentResponse / JobEnvelope (Pydantic)
      llm/
        base.py                     # LLMProvider interface
        anthropic_provider.py       # default adapter (Claude)
      agents/
        base_agent.py               # wraps a compiled LangGraph graph
        registry.py                 # name -> agent instance, one service can host several
      tools/
        java_backend_tool.py        # LangChain Tool base class that calls back into
                                     # Java's REST API (case/client/party lookups) with
                                     # a service-to-service OAuth2 token
      messaging/
        consumer.py                 # aio-pika consumer: ai.agent.requests -> run agent
        publisher.py                # aio-pika publisher: result -> ai.agent.responses
      service/
        app.py                      # FastAPI app: /health, /agents (introspection),
                                     # /invoke (direct sync call, local testing only)
    pyproject.toml
  services/
    kyc-risk-agent/                 # first concrete microservice
      agents/summarizer_graph.py    # the actual LangGraph graph + tools for this agent
      Dockerfile
      requirements.txt              # cddp_ai_sdk (path/editable in dev, private index in prod)
```

Each new agent (duplicate-resolution assistant, case-narrative generator,
etc.) is a new folder under `ai/services/`, not a new SDK — the SDK stays
generic; only the graph/tools/agent name differ per service.

---

## 3. Java side

**New Liquibase changeset** (`ddl/0011-ai-jobs.yaml`, module pattern
matching the existing `ddl/000N-description.yaml` convention):

`tlog_ai_agent_jobs`
| column | notes |
|---|---|
| `id` (job_id) | uuid PK |
| `tenant_id` | FK → `tmstr_tenants` |
| `agent_name` | varchar, e.g. `kyc-risk-summarizer` |
| `requested_by` | varchar |
| `case_id` / `client_id` | uuid, nullable, no FK (agents may run without either) |
| `status` | `PENDING / RUNNING / COMPLETED / FAILED / TIMED_OUT` |
| `request_payload` / `response_payload` | jsonb |
| `error_message` | text |
| `model` | varchar |
| `token_usage` | jsonb |
| `submitted_ts` / `completed_ts` | timestamp |
| `duration_ms` | bigint |

Subject to `tcfg_data_rtntn_plcy` like every other table — flag this table
name in that policy config once retention rules are decided.

**New components:**
- `AiAgentController` — `POST /api/ai/agents/{agentName}/queries` (submit,
  returns `202` + `job_id`); `GET /api/ai/agents/queries/{jobId}` (poll).
- `AiJobService` — writes the job row, publishes to RabbitMQ, enforces
  tenant/permission checks.
- `AiResponseListener` — `@RabbitListener` on `ai.agent.responses`, updates
  the job row on completion.
- `@Scheduled` sweep (or a Spring Batch job, since `spring-boot-starter-batch`
  is already a dependency) — flips stale `PENDING`/`RUNNING` jobs older than
  a timeout threshold to `TIMED_OUT`.
- Service-to-service auth: Java's OAuth2 authorization server issues a
  client-credentials token; Python fetches/refreshes it and attaches it as
  a Bearer token whenever a `JavaBackendTool` calls back into Java's REST
  API mid-agent-run.

---

## 4. Frontend

First real API integration in this codebase:
- `apiClient.ts` (doesn't exist yet) — thin fetch wrapper.
- `useAiJobPolling` hook — `POST` to submit, poll `GET .../queries/{jobId}`
  on an interval with backoff until `COMPLETED`/`FAILED`.
- First surface: an "AI Summary" panel on `CaseDetailPage.tsx` (existing
  page, natural fit) calling the `kyc-risk-agent` service.

---

## 5. Docker Compose additions

```yaml
ai-kyc-agent:
  build: { context: ./ai/services/kyc-risk-agent }
  environment:
    ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    RABBITMQ_HOST: rabbitmq
    JAVA_BACKEND_URL: http://backend:8080
    OAUTH2_TOKEN_URL: http://backend:8080/oauth2/token
    OAUTH2_CLIENT_ID: ai-kyc-agent
    OAUTH2_CLIENT_SECRET: ${AI_KYC_AGENT_CLIENT_SECRET}
  ports: ["8001:8000"]
  depends_on:
    rabbitmq: { condition: service_healthy }
    backend: { condition: service_healthy }
```
Secrets (`ANTHROPIC_API_KEY`, client secrets) via `.env` / compose secrets,
never committed.

---

## 6. Reliability

- **Retry / DLQ**: RabbitMQ dead-letter queue for the request queue — after
  N redeliveries, message goes to DLQ and the job is marked `FAILED`.
- **Idempotency**: `job_id` doubles as the message correlation id; Python
  consumer checks-before-processing the same way `TSUB_DUPLICATE_IDEMPOTENCY`
  already guards replay in the duplicate-check flow.
- **Timeout**: the sweep job in §3 catches agent runs that never respond
  (Python crash, broker issue) rather than leaving jobs stuck `PENDING`
  forever.

---

## 7. Phased rollout

1. **Walking skeleton**: SDK core + one agent (`kyc-risk-agent`, case
   summarizer) + `tlog_ai_agent_jobs` + controller/listener + one frontend
   panel. Proves the whole path end-to-end.
2. **Harden**: OAuth2 both directions, DLQ + retry, timeout sweep.
3. **Expand**: more agents (duplicate-resolution assistant tying into
   `TSUB_DUPLICATE_RESOLUTIONS`, risk-narrative generator), multi-agent
   LangGraph graphs (a supervisor routing to sub-agents).
4. **Observability**: cost/token dashboards per tenant, retention
   enforcement via `tcfg_data_rtntn_plcy`, optional SSE layer on top of the
   same job contract for live status updates without changing the MQ design.

---

## 8. Open questions before implementation

1. **LLM provider/model** — plan assumes Claude via `AnthropicProvider` as
   the SDK's default adapter (matches this environment); confirm before
   wiring API keys.
2. **First concrete agent/use case** — plan assumes a case summarizer on
   `CaseDetailPage`; confirm or pick a different first slice.
3. **Package distribution for `cddp_ai_sdk`** — editable/path install
   within the monorepo (simplest for a single-repo setup) vs. a private
   PyPI index (needed once agent services live in separate repos).
4. **Secrets management** — `.env` files for local dev are fine short-term;
   confirm what's used in real deployment (Vault, cloud secrets manager,
   etc.) before this goes past a dev environment.

---

## 9. DB-backed LLM provider selection

Generalizes what was a hardcoded `AnthropicProvider()` construction into an
admin-configurable choice of provider + API key, stored per tenant.

**Schema** (`ddl/0012-llm-provider-cfgs.yaml`): `tcfg_llm_provider_cfgs`
(`tenant_id`, `provider` [`CLAUDE`/`GEMINI`/`HUGGINGFACE`, plain varchar +
CHECK — deliberately not a native Postgres enum, see the changeset's own
comment], `model_name`, `api_key_encrypted`, `is_active`). A partial unique
index (`WHERE is_active`) enforces one active provider per tenant at the
DB level, not just in application code.

**Encryption**: `com.cddp.ai.crypto.ApiKeyCipher` — AES-256-GCM, key from
`LLM_CONFIG_ENCRYPTION_KEY` (`openssl rand -base64 32`), read lazily so
the app still starts without it. Losing the key makes every saved API key
permanently undecryptable — treat it like any other production secret.

**Java surface**:
- `LlmProviderConfigController` (`/api/admin/integrations/llm-providers`)
  — admin CRUD; `LlmProviderConfigResponse` only ever carries a masked key
  (`••••••••ab12`).
- `InternalLlmConfigController` (`/api/internal/llm-config/active`) —
  service-to-service only, returns the *decrypted* key. Same
  Spring-Security-default protection as everything else in this app, so
  it's still blocked on the same OAuth2 client-credentials gap as
  `CaseController` (§ above / the finding from the previous session).

**Python surface**: `llm/factory.py` maps a provider name to
`AnthropicProvider` / `GeminiProvider` / `HuggingFaceProvider` (Gemini and
HuggingFace SDKs are lazy imports gated behind the `gemini`/`huggingface`
pip extras — a deployment that never selects them never installs their
SDKs). `config/llm_config_client.py` calls
`InternalLlmConfigController` to resolve the active config for a tenant.
`kyc-risk-summarizer` now resolves its provider per request from this
path, falling back to `ANTHROPIC_API_KEY` from the environment only if
Java has no active config — a local-dev convenience, not the production
path.

**Frontend**: `AiModelProviderPanel` on the admin Integrations page —
provider dropdown, API key field, optional model override, per-row
"Activate". Uses the same `VITE_DEMO_TENANT_ID` placeholder as
`AiWiringCheckPanel` (no real tenant/session resolution exists yet).

**Verified**: Liquibase schema ↔ Hibernate entity match (clean
`ddl-auto=validate` startup), and the AES-GCM cipher round-trips correctly
standalone (encrypt → decrypt → matches original; two encryptions of the
same plaintext differ, confirming fresh IVs; fails with a clear message
when the key is unset). **Not** verified end-to-end over HTTP — same
pre-existing auth gap as the rest of `/api/**` (no working login exists in
this app yet), so the admin CRUD flow and the Python-side DB lookup are
code-complete but unexercised end-to-end until that's resolved.