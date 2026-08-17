import { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import {
  activateLlmProviderConfig,
  listLlmProviderConfigs,
  saveLlmProviderConfig,
  type LlmProviderConfig,
  type LlmProviderName,
} from "../lib/apiClient";

// Placeholder until real auth/session wiring resolves a tenant from the
// logged-in user — same caveat as AiWiringCheckPanel and
// AiAgentController's tenantId parameter (backend).
const DEMO_TENANT_ID = import.meta.env.VITE_DEMO_TENANT_ID ?? "";

const PROVIDERS: { value: LlmProviderName; label: string }[] = [
  { value: "CLAUDE", label: "Claude (Anthropic)" },
  { value: "GEMINI", label: "Gemini (Google)" },
  { value: "HUGGINGFACE", label: "Hugging Face" },
];

/**
 * Lets an admin pick an AI model provider, save its API key, and mark
 * one active per tenant. The active provider is what
 * pySDK/services/kyc-risk-agent/agent.py resolves at request time via
 * Java's InternalLlmConfigController — no redeploy needed to switch
 * providers or rotate a key.
 */
export function AiModelProviderPanel() {
  const [configs, setConfigs] = useState<LlmProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [provider, setProvider] = useState<LlmProviderName>("CLAUDE");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function refresh() {
    if (!DEMO_TENANT_ID) return;
    setIsLoading(true);
    setError(null);
    try {
      setConfigs(await listLlmProviderConfigs(DEMO_TENANT_ID));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    try {
      await saveLlmProviderConfig(DEMO_TENANT_ID, {
        provider,
        apiKey,
        modelName: modelName || undefined,
        active: configs.length === 0, // first-ever save activates itself; otherwise use "Activate"
      });
      setApiKey("");
      setModelName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActivate(target: LlmProviderName) {
    setError(null);
    try {
      await activateLlmProviderConfig(DEMO_TENANT_ID, target);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-blue-500" />
          <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>
            AI Model Provider
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          Choose which LLM the AI agents use and store its API key. Only one provider is active per tenant —
          switching here takes effect on the next agent run, no redeploy.
        </p>
      </div>

      {!DEMO_TENANT_ID && (
        <p className="text-xs text-amber-600">Set VITE_DEMO_TENANT_ID to a real tmstr_tenants row id to use this.</p>
      )}

      {configs.length > 0 && (
        <div className="flex flex-col gap-2">
          {configs.map((c) => (
            <div
              key={c.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                c.active ? "border-blue-200 bg-blue-50/50" : "border-gray-100"
              }`}
            >
              <div className="flex items-center gap-2">
                {c.active && <CheckCircle2 size={13} className="text-blue-500 flex-shrink-0" />}
                <span className="font-semibold text-gray-700">{c.provider}</span>
                {c.modelName && <span className="text-gray-400">· {c.modelName}</span>}
                <span className="font-mono text-gray-400">{c.maskedApiKey}</span>
              </div>
              {!c.active && (
                <button
                  onClick={() => handleActivate(c.provider)}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Activate
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {isLoading && <Loader2 size={13} className="animate-spin text-gray-300" />}

      <div className="grid grid-cols-2 gap-2">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LlmProviderName)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PROVIDERS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          placeholder="Model (optional override)"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="API key"
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          disabled={isSaving || !apiKey || !DEMO_TENANT_ID}
          onClick={handleSave}
          className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}