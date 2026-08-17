import { useCallback, useRef, useState } from "react";
import { submitAgentQuery, getAgentJobStatus, type AgentJobStatus } from "../lib/apiClient";

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED", "TIMED_OUT"]);
const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 40; // ~60s at 1.5s intervals, matches the Java-side 5min sweep loosely enough for a UI-level giveup

/**
 * Submit an AI agent query and poll Java's job-status endpoint until it
 * reaches a terminal state. Mirrors the async job + polling pattern in
 * files/ai-agent-integration-plan.md — no WebSocket/SSE involved, just a
 * plain interval poll.
 */
export function useAiJobPolling() {
  const [status, setStatus] = useState<AgentJobStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const submit = useCallback(
    async (
      agentName: string,
      tenantId: string,
      body: { context?: Record<string, unknown>; input?: Record<string, unknown> },
    ) => {
      stopPolling();
      setError(null);
      setStatus(null);
      setIsSubmitting(true);
      try {
        const { jobId } = await submitAgentQuery(agentName, tenantId, body);
        let pollsRemaining = MAX_POLLS;

        const poll = async () => {
          try {
            const next = await getAgentJobStatus(jobId);
            setStatus(next);
            if (TERMINAL_STATUSES.has(next.status)) {
              return;
            }
            pollsRemaining -= 1;
            if (pollsRemaining <= 0) {
              setError("Gave up waiting for a response — the job may still complete server-side.");
              return;
            }
            timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        };

        await poll();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [stopPolling],
  );

  return { status, isSubmitting, error, submit, stopPolling };
}