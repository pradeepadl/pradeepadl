// Thin fetch wrapper for the Java backend. This is the first real
// frontend<->backend wiring in this codebase — everything else in
// src/app/data.ts is still mock data. See files/ai-agent-integration-plan.md
// for the AI agent flow this backs (submit a job, poll for the result), and
// com.cddp.config.SecurityConfig for the auth this now talks to.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export interface AgentJobStatus {
  jobId: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "TIMED_OUT";
  output: Record<string, unknown> | null;
  model: string | null;
  tokenUsage: { input: number; output: number } | null;
  errorMessage: string | null;
  submittedTs: string;
  completedTs: string | null;
  durationMs: number | null;
}

// ── Auth ─────────────────────────────────────────────────────────────────
// Session-scoped only (sessionStorage, cleared when the tab closes) —
// LoginPage's "keep me signed in" checkbox isn't wired to anything yet;
// wire it to a localStorage variant of this if that persistence is wanted.

const SESSION_KEY = "cddp.session";

interface StoredSession {
  username: string;
  accessToken: string;
  expiresAt: number; // epoch ms
}

function loadSession(): StoredSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    if (session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function isLoggedIn(): boolean {
  return loadSession() !== null;
}

export function getCurrentUsername(): string | null {
  return loadSession()?.username ?? null;
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function login(username: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(response.status === 401 ? "Invalid username or password." : `Login failed (${response.status})`);
  }
  const body = (await response.json()) as { accessToken: string; expiresIn: number };
  const session: StoredSession = {
    username,
    accessToken: body.accessToken,
    expiresAt: Date.now() + body.expiresIn * 1000,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = loadSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`${init?.method ?? "GET"} ${path} -> ${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}

export function submitAgentQuery(
  agentName: string,
  tenantId: string,
  body: { context?: Record<string, unknown>; input?: Record<string, unknown> },
): Promise<{ jobId: string }> {
  const query = new URLSearchParams({ tenantId }).toString();
  return request(`/api/ai/agents/${encodeURIComponent(agentName)}/queries?${query}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getAgentJobStatus(jobId: string): Promise<AgentJobStatus> {
  return request(`/api/ai/agents/queries/${encodeURIComponent(jobId)}`);
}

// ── AI Model Provider config (admin Integrations page) ─────────────────────
// Backed by com.cddp.ai.controller.LlmProviderConfigController /
// tcfg_llm_provider_cfgs. The API key never round-trips back to this
// client in cleartext — list() only ever returns a masked value.

export type LlmProviderName = "CLAUDE" | "GEMINI" | "HUGGINGFACE";

export interface LlmProviderConfig {
  id: string;
  provider: LlmProviderName;
  modelName: string | null;
  maskedApiKey: string;
  active: boolean;
  lastUpdatedTs: string | null;
}

export function listLlmProviderConfigs(tenantId: string): Promise<LlmProviderConfig[]> {
  const query = new URLSearchParams({ tenantId }).toString();
  return request(`/api/admin/integrations/llm-providers?${query}`);
}

export function saveLlmProviderConfig(
  tenantId: string,
  body: { provider: LlmProviderName; apiKey: string; modelName?: string; active: boolean },
): Promise<LlmProviderConfig> {
  const query = new URLSearchParams({ tenantId }).toString();
  return request(`/api/admin/integrations/llm-providers?${query}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function activateLlmProviderConfig(tenantId: string, provider: LlmProviderName): Promise<LlmProviderConfig> {
  const query = new URLSearchParams({ tenantId }).toString();
  return request(`/api/admin/integrations/llm-providers/${provider}/activate?${query}`, {
    method: "POST",
  });
}