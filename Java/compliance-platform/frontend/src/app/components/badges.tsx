// ── Shared status/severity pill badges ──────────────────────────────────────
// Extracted out of App.tsx so new page modules can reuse them.

export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    Critical: "bg-red-100 text-red-700",
    High: "bg-orange-100 text-orange-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[severity] ?? "bg-gray-100 text-gray-600"}`}>
      {severity}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, string> = {
    High: "bg-red-50 text-red-600 border border-red-200",
    Medium: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    Low: "bg-green-50 text-green-700 border border-green-200",
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[risk] ?? ""}`}>
      {risk}
    </span>
  );
}

export function AlertStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open:        "bg-blue-100 text-blue-700",
    "In Review": "bg-yellow-100 text-yellow-700",
    Escalated:   "bg-red-100 text-red-700",
    Closed:      "bg-gray-100 text-gray-500",
  };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? ""}`}>{status}</span>;
}

export function CasePriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    Critical: "bg-red-100 text-red-700",
    High:     "bg-orange-100 text-orange-700",
    Medium:   "bg-yellow-100 text-yellow-700",
    Low:      "bg-gray-100 text-gray-500",
  };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[priority] ?? ""}`}>{priority}</span>;
}

export function CaseStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open:        "bg-blue-100 text-blue-700",
    "In Review": "bg-yellow-100 text-yellow-700",
    Escalated:   "bg-red-100 text-red-700",
    Closed:      "bg-green-100 text-green-700",
  };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${map[status] ?? ""}`}>{status}</span>;
}