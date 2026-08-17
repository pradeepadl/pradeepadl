import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useAiJobPolling } from "../hooks/useAiJobPolling";

// Placeholder until real auth/session wiring resolves a tenant from the
// logged-in user — see the tenantId comment in AiAgentController (backend).
// Point this at a real row in tmstr_tenants for this panel to work; there's
// no seed tenant in dml/ yet.
const DEMO_TENANT_ID = import.meta.env.VITE_DEMO_TENANT_ID ?? "";

/**
 * Proves the Java <-> RabbitMQ <-> Python AI agent pipeline end-to-end
 * against the `echo` diagnostic agent (see pySDK/services/kyc-risk-agent),
 * which needs no LLM key and no real case data. This is deliberately NOT
 * wired to `kyc-risk-summarizer` yet: CaseDetailPage's case data is mock
 * (src/app/data.ts), not real tmstr_cases rows, so a real summarizer call
 * would 404 against the Java case-lookup endpoint. Swap the agent name
 * and pass a real case_id once case data is backed by the actual API.
 */
export function AiWiringCheckPanel() {
  const [question, setQuestion] = useState("Is the AI pipeline wired up?");
  const { status, isSubmitting, error, submit } = useAiJobPolling();

  const isBusy = isSubmitting || status?.status === "PENDING" || status?.status === "RUNNING";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles size={15} className="text-blue-500" />
        <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>
          AI Pipeline Check
        </span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">
        Diagnostic panel — round-trips a message through the Java job queue and the Python{" "}
        <code className="bg-gray-50 px-1 py-0.5 rounded">echo</code> agent. Not a real summarizer yet.
      </p>

      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ask something…"
        />
        <button
          disabled={isBusy || !DEMO_TENANT_ID}
          onClick={() => submit("echo", DEMO_TENANT_ID, { input: { question } })}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {isBusy ? "Waiting…" : "Send"}
        </button>
      </div>

      {!DEMO_TENANT_ID && (
        <p className="text-xs text-amber-600">
          Set VITE_DEMO_TENANT_ID to a real tmstr_tenants row id to try this.
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {status && (
        <pre className="text-xs bg-gray-50 border border-gray-100 rounded-lg p-3 overflow-x-auto">
          {JSON.stringify(status, null, 2)}
        </pre>
      )}
    </div>
  );
}