# Auth Implementation Model

How authentication/authorization works in this app: `com.cddp.config.SecurityConfig`,
`com.cddp.user.controller.AuthController`, and the two consumers that depend on
them (the frontend SPA, and the Python AI agent service in `pySDK/`).

---

## 1. The gap this closes

The app had `spring-boot-starter-security`, `spring-boot-starter-security-oauth2-authorization-server`,
and `spring-boot-starter-security-oauth2-client` on the classpath with **zero**
configuration. Every `/api/**` request 401'd with `WWW-Authenticate: Basic`, and
there was no way to ever authenticate — no generated password, no registered
OAuth2 client, nothing.

**Root cause**: Spring Boot's default in-memory-user autoconfiguration
(`UserDetailsServiceAutoConfiguration`) backs off automatically whenever OAuth2
client classes (`ClientRegistrationRepository`, `OpaqueTokenIntrospector`) are on
the classpath — it assumes you intend to configure real OAuth2 login instead.
Nothing had. This was confirmed empirically by reading Spring Boot's own
condition-evaluation report (`--debug`), not guessed.

---

## 2. Two identities, one signing key

| | Frontend user | Python AI agent service |
|---|---|---|
| **Grant** | Custom login endpoint (not a standard OAuth2 grant) | OAuth2 `client_credentials` |
| **Endpoint** | `POST /api/auth/login` | `POST /oauth2/token` |
| **Credential** | username + password | `client_id` + `client_secret` (HTTP Basic) |
| **Who validates it** | `AuthenticationManager` → `DaoAuthenticationProvider` → `UserDetailsService` | Spring Authorization Server (auto-configured) |
| **Token minted by** | `AuthController` (`JwtEncoder`, manual) | Spring Authorization Server (automatic) |
| **Scope claim** | `"api.access"` (hardcoded) | whatever the request asks for, must be ≤ the client's registered scopes (`internal.read`) |

Both paths mint a **JWT signed with the same RSA key** — the one Spring Boot's
Authorization Server auto-configuration (`OAuth2AuthorizationServerJwtAutoConfiguration`)
already generates once a client is registered. `SecurityConfig.jwtEncoder()`
reuses that same `JWKSource<SecurityContext>` bean rather than managing a
separate key, so **one resource-server config validates tokens from both
sources** with a single `JwtDecoder`.

The key itself is **ephemeral** — Spring Boot generates a fresh RSA keypair in
memory on every JVM restart (see §7, Known Limitations). Fine for a single
dev/demo instance; wrong for anything horizontally scaled or long-lived.

---

## 3. Why the SecurityConfig looks the way it does

Spring Boot ships a ready-made `OAuth2AuthorizationServerWebSecurityConfiguration`
that would normally set up `/oauth2/**` automatically. Its source (read directly,
not guessed) is:

```java
@Configuration(proxyBeanMethods = false)
@ConditionalOnDefaultWebSecurity
@ConditionalOnBean({ RegisteredClientRepository.class, AuthorizationServerSettings.class })
class OAuth2AuthorizationServerWebSecurityConfiguration {

    @Bean @Order(Ordered.HIGHEST_PRECEDENCE)
    SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) { ... }

    @Bean @Order(SecurityFilterProperties.BASIC_AUTH_ORDER)
    SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) {
        http.authorizeHttpRequests(a -> a.anyRequest().authenticated()).formLogin(withDefaults());
        return http.build();
    }
}
```

Two problems with using this as-is:

1. **`@ConditionalOnDefaultWebSecurity`** backs the *entire class* off — including
   the `/oauth2/token` endpoint Python needs — the instant *any* app-defined
   `SecurityFilterChain` bean exists anywhere in the context. There is no way to
   define a custom chain for `/api/**` *alongside* Boot's auto-wired AS chain;
   defining any chain of our own means taking over **all** of it.
2. Boot's own `defaultSecurityFilterChain` uses `formLogin()` — an HTML login
   page + session cookie. Wrong shape entirely for a stateless JSON REST API
   consumed by a `fetch()`-based SPA and a Python service.

So `SecurityConfig` defines **all three** chains itself, adapting Boot's own
template (swapping `formLogin()` for `oauth2ResourceServer().jwt()`), in
priority order:

| Order | Bean | Matches | Behavior |
|---|---|---|---|
| `HIGHEST_PRECEDENCE` | `authorizationServerSecurityFilterChain` | AS's own endpoint set (`/oauth2/token`, `/oauth2/jwks`, `/.well-known/**`, …) via `authorizationServer.getEndpointsMatcher()` | AS machinery only — **not** a resource server, since the token endpoint itself authenticates via HTTP Basic client credentials, not a bearer JWT |
| `LOWEST_PRECEDENCE - 1` | `apiSecurityFilterChain` | `/api/**` | Stateless JWT resource server. `POST /api/auth/login` is `permitAll`; `/api/internal/**` requires `SCOPE_internal.read`; everything else just needs a valid JWT |
| `LOWEST_PRECEDENCE` | `defaultSecurityFilterChain` | everything else | JWT resource server; `/actuator/health` is `permitAll` (matches the Dockerfile's TCP healthcheck expectation) |

`securityMatcher(...)` scopes each chain to a URL prefix; Spring Security tries
them in `@Order` and uses the first match.

---

## 4. `/api/internal/**` — scope-gated, not just authenticated

`InternalLlmConfigController` (`GET /api/internal/llm-config/active`) returns a
**decrypted** third-party LLM API key. It would be a real problem if a
logged-in frontend user's JWT could reach it. So:

- `apiSecurityFilterChain` requires `hasAuthority("SCOPE_internal.read")`
  specifically for `/api/internal/**`, ahead of the general `.anyRequest().authenticated()`
  fallback.
- The `internal.read` scope is registered **only** on the `ai-kyc-agent` OAuth2
  client (`application.properties`) — a login-minted JWT's `scope` claim is
  hardcoded to `"api.access"` and never includes it.
- Spring's default `JwtAuthenticationConverter` maps each space-delimited entry
  in a JWT's `scope` claim to a `SCOPE_<value>` authority automatically — no
  custom converter needed.

Verified directly (not assumed): a login JWT gets **403** on this route; a
`client_credentials` JWT with `scope=internal.read` gets past auth to the
controller (**404**, no active config for the test tenant — i.e., auth and
scope both passed, only the business lookup came up empty).

---

## 5. Configuration reference

### `application.properties`
```properties
spring.security.oauth2.authorizationserver.client.ai-kyc-agent.registration.client-id=ai-kyc-agent
spring.security.oauth2.authorizationserver.client.ai-kyc-agent.registration.client-secret={noop}${AI_KYC_AGENT_CLIENT_SECRET:ai-kyc-agent-dev-secret}
spring.security.oauth2.authorizationserver.client.ai-kyc-agent.registration.client-authentication-methods=client_secret_basic
spring.security.oauth2.authorizationserver.client.ai-kyc-agent.registration.authorization-grant-types=client_credentials
spring.security.oauth2.authorizationserver.client.ai-kyc-agent.registration.scopes=internal.read
spring.security.oauth2.authorizationserver.client.ai-kyc-agent.token.access-token-time-to-live=15m

cddp.demo-admin.username=${DEMO_ADMIN_USERNAME:admin}
cddp.demo-admin.password=${DEMO_ADMIN_PASSWORD:changeme}
```

Registering at least one client here is what activates
`OAuth2AuthorizationServerAutoConfiguration` in the first place — remove it and
the whole AS setup (including the JWK source / decoder / `/oauth2/**`
endpoints) goes dormant again.

The `{noop}` prefix is Spring Security's `{id}encodedPassword` convention
(`DelegatingPasswordEncoder`) — it marks the secret as plaintext. Fine for this
dev-only demo client; a real deployment should store a pre-hashed `{bcrypt}...`
secret instead and never default one inline in a properties file.

### `docker-compose.deploy.yml`
```yaml
backend:
  environment:
    AI_KYC_AGENT_CLIENT_SECRET: ${AI_KYC_AGENT_CLIENT_SECRET:-ai-kyc-agent-dev-secret}
    DEMO_ADMIN_USERNAME: ${DEMO_ADMIN_USERNAME:-admin}
    DEMO_ADMIN_PASSWORD: ${DEMO_ADMIN_PASSWORD:-changeme}

ai-kyc-agent:
  environment:
    OAUTH2_CLIENT_ID: ai-kyc-agent
    OAUTH2_CLIENT_SECRET: ${AI_KYC_AGENT_CLIENT_SECRET:-ai-kyc-agent-dev-secret}
```
`AI_KYC_AGENT_CLIENT_SECRET` is the **same variable** on both services
deliberately — one source of truth, can't silently drift apart into a
mismatched secret on one side.

---

## 6. Consumers

### Frontend (`frontend/src/app/lib/apiClient.ts`)
- `login(username, password)` → `POST /api/auth/login` → stores
  `{username, accessToken, expiresAt}` as JSON in `sessionStorage` under key
  `cddp.session` (session-scoped only — cleared when the tab closes; the
  LoginPage "keep me signed in" checkbox isn't wired to a persistent variant
  yet).
- `request()` (the shared fetch wrapper every API call goes through) attaches
  `Authorization: Bearer <accessToken>` automatically whenever a session is
  stored.
- `isLoggedIn()` / `getCurrentUsername()` restore session state on page
  load (`App.tsx` seeds its `isAuthenticated`/`currentUser` state from these
  instead of always starting logged out).
- `logout()` clears the stored session.

### Python (`pySDK/sdk/cddp_ai_sdk/`)
- `auth/java_token_cache.py` — `JavaTokenCache.get()`, shared by every
  component that calls back into Java. POSTs to `OAUTH2_TOKEN_URL` with
  `grant_type=client_credentials&scope=internal.read` and HTTP Basic
  `(OAUTH2_CLIENT_ID, OAUTH2_CLIENT_SECRET)`, caches the token, refreshes 30s
  before `expires_in` elapses.
  - **The `scope` parameter must be explicit.** Spring Authorization Server
    does *not* default to a client's full registered scope set when a
    `client_credentials` request omits it — an omitted scope issues a token
    with none, which then 403s on anything gated by
    `hasAuthority("SCOPE_internal.read")`. This was a real bug caught by
    testing, not anticipated in the design.
- `tools/java_backend_tool.py` (`JavaBackendTool`) and
  `config/llm_config_client.py` both use the shared cache to attach
  `Authorization: Bearer <token>` to their calls into `CaseController` and
  `InternalLlmConfigController` respectively.

---

## 7. Known limitations (deliberate scope cuts, not oversights)

- **In-memory `UserDetailsService`, one hardcoded user.** `com.cddp.user` is
  still an empty package pending a real `User` entity/table. Swapping
  `SecurityConfig.userDetailsService()` for a DB-backed implementation is the
  only change needed — nothing else depends on it being in-memory.
- **In-memory `RegisteredClientRepository`.** Only one OAuth2 client exists
  (`ai-kyc-agent`), configured entirely via properties. Adding more clients at
  scale would want `JdbcRegisteredClientRepository` (ships with Spring
  Authorization Server) instead of growing the properties file indefinitely.
- **Ephemeral signing key.** Boot generates a new RSA keypair on every
  restart — every previously-issued token becomes unverifiable the moment the
  backend restarts. Fine for dev; a real deployment needs a persistent JWK
  (e.g. from a secrets manager) via a custom `JWKSource` bean.
- **No refresh tokens, no logout/revocation endpoint.** Login JWTs are
  fire-and-forget for 1 hour; client-credentials tokens for 15 minutes. There's
  no server-side way to invalidate a token before it expires.
- **No RBAC beyond the one `internal.read` scope split.** Every authenticated
  frontend user can reach every `/api/**` route except the internal ones —
  there's no per-role restriction (e.g., a non-admin user vs. the demo admin)
  because there's only one user.
- **Client secret and demo password default inline in version control**
  (`ai-kyc-agent-dev-secret`, `changeme`). Consistent with this repo's existing
  local-dev convention (`POSTGRES_PASSWORD: secret`, `NEO4J_AUTH: neo4j/notverysecret`
  in `docker-compose.deploy.yml`) — override via the env vars in §5 before this
  goes anywhere near a shared or production environment.

---

## 8. Verified, not just written

Every claim above was checked against the running stack, not assumed from the
code:

- `POST /api/auth/login` with `admin`/`changeme` → real signed JWT
- That JWT → `GET /api/cases/{uuid}` → **404** (was 401 before this work)
- Same JWT → `GET /api/internal/llm-config/active` → **403** (scope-blocked)
- `POST /oauth2/token` (client_credentials, Basic auth, explicit
  `scope=internal.read`) → real JWT with `"scope": ["internal.read"]`
- That token → the internal endpoint → **404** (past both auth and the scope
  check; no config exists for the test tenant, which is the correct business
  answer)
- **Python's actual production code** (`java_token_cache.get()`,
  `CaseLookupTool._arun()`) executed inside the running `ai-kyc-agent`
  container — not simulated via curl — reaches both endpoints successfully
- Frontend rebuilt with the real login/session code; confirmed present in the
  built JS bundle; full login → authenticated-call cycle re-verified against
  the running stack