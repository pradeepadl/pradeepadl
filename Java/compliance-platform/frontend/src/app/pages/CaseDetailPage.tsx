import { useState } from "react";
import { ChevronRight, Search, X, Paperclip, Trash2 } from "lucide-react";
import { allCases, allAlerts, CASE_STATUSES } from "../data";
import { SeverityBadge, AlertStatusBadge, CaseStatusBadge, CasePriorityBadge } from "../components/badges";
import { Modal, ModalFooter } from "../components/Modal";

export function CaseDetailPage({
  caseId, attachedAlertIds, onAttachAlerts, onRemoveAlert, onBack,
}: {
  caseId: string;
  attachedAlertIds: string[];
  onAttachAlerts: (caseId: string, alertIds: string[]) => void;
  onRemoveAlert: (caseId: string, alertId: string) => void;
  onBack: () => void;
}) {
  const caseItem = allCases.find((c) => c.id === caseId)!;
  const [currentStatus, setCurrentStatus] = useState(caseItem.status);
  const [attachOpen, setAttachOpen] = useState(false);

  const attachedAlerts = allAlerts.filter((a) => attachedAlertIds.includes(a.id));

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Cases</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-500 font-mono text-xs">{caseItem.id}</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">{caseItem.title}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{caseItem.title}</h2>
              <CasePriorityBadge priority={caseItem.priority} />
              <CaseStatusBadge status={currentStatus} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
              <span className="font-mono text-xs text-gray-400">{caseItem.id}</span>
              <span>·</span><span>{caseItem.client}</span>
              <span>·</span><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{caseItem.type}</span>
              <span>·</span><span className="text-xs text-gray-400">Assignee: {caseItem.assignee}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Status</label>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {CASE_STATUSES.filter((s) => s !== "All").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>Case Details</div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {[
              { label: "Case ID",     value: caseItem.id },
              { label: "Client",      value: caseItem.client },
              { label: "Type",        value: caseItem.type },
              { label: "Priority",    value: caseItem.priority },
              { label: "Assignee",    value: caseItem.assignee },
              { label: "Opened",      value: caseItem.opened },
              { label: "Due Date",    value: caseItem.due },
              { label: "Status",      value: currentStatus },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
                <div className="text-sm text-gray-800 font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
          <div className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Investigation Summary</div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {attachedAlerts.length === 0
              ? "No alerts are currently linked to this case. Attach related alerts below to build the investigation record."
              : `${attachedAlerts.length} alert${attachedAlerts.length !== 1 ? "s" : ""} linked for investigation, spanning ${new Set(attachedAlerts.map((a) => a.category)).size} rule categor${new Set(attachedAlerts.map((a) => a.category)).size !== 1 ? "ies" : "y"}.`}
          </p>
        </div>
      </div>

      {/* Linked alerts */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Linked Alerts</span>
            <span className="text-xs text-gray-400 ml-2">{attachedAlerts.length} attached</span>
          </div>
          <button
            onClick={() => setAttachOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Paperclip size={13} /> Attach Alerts
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Alert ID", "Type", "Client", "Category", "Severity", "Status", "Date", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attachedAlerts.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-14 text-center text-gray-400 text-sm">No alerts attached yet.</td></tr>
            ) : attachedAlerts.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{a.id}</td>
                <td className="px-5 py-3.5 text-gray-700 max-w-[200px] truncate">{a.type}</td>
                <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[160px] truncate">{a.client}</td>
                <td className="px-5 py-3.5"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{a.category}</span></td>
                <td className="px-5 py-3.5"><SeverityBadge severity={a.severity} /></td>
                <td className="px-5 py-3.5"><AlertStatusBadge status={a.status} /></td>
                <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{a.date}</td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => onRemoveAlert(caseItem.id, a.id)}
                    title="Detach from case"
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AttachAlertsModal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        excludeIds={attachedAlertIds}
        preferredClient={caseItem.client}
        onAttach={(ids) => { onAttachAlerts(caseItem.id, ids); setAttachOpen(false); }}
      />
    </div>
  );
}

function AttachAlertsModal({
  open, onClose, excludeIds, preferredClient, onAttach,
}: {
  open: boolean;
  onClose: () => void;
  excludeIds: string[];
  preferredClient: string;
  onAttach: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const candidates = allAlerts
    .filter((a) => !excludeIds.includes(a.id))
    .filter((a) => {
      const q = search.toLowerCase();
      return !q || a.id.toLowerCase().includes(q) || a.type.toLowerCase().includes(q) || a.client.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.client === preferredClient ? -1 : 0) - (b.client === preferredClient ? -1 : 0));

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleClose() {
    setSearch("");
    setSelected([]);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Attach Alerts" subtitle="Select one or more alerts to link to this case for investigation" width="max-w-2xl">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, client, or alert type…"
            className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
          />
          {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500"><X size={13} /></button>}
        </div>

        <div className="border border-gray-100 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
          {candidates.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-400">No matching alerts.</div>
          ) : candidates.map((a) => {
            const isSelected = selected.includes(a.id);
            return (
              <label
                key={a.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-gray-50/60"}`}
              >
                <input type="checkbox" checked={isSelected} onChange={() => toggle(a.id)} className="rounded border-gray-300 accent-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-400">{a.id}</span>
                    <span className="text-sm font-medium text-gray-800 truncate">{a.type}</span>
                  </div>
                  <div className="text-xs text-gray-400 truncate">{a.client} · {a.category}</div>
                </div>
                <SeverityBadge severity={a.severity} />
              </label>
            );
          })}
        </div>
      </div>

      <ModalFooter>
        <button onClick={handleClose} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button
          disabled={selected.length === 0}
          onClick={() => onAttach(selected)}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Attach {selected.length > 0 ? `(${selected.length})` : ""}
        </button>
      </ModalFooter>
    </Modal>
  );
}