import { useState } from "react";
import { ChevronRight, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { Modal, ModalFooter, FormField, inputClass } from "../../components/Modal";

type Policy = {
  id: string; title: string; category: string; description: string;
  status: "Draft" | "Active" | "Under Review" | "Archived";
  version: string; owner: string; effectiveDate: string;
};

const CATEGORIES = ["AML", "KYC", "Sanctions", "CTF", "Data Privacy", "General"];

const initialPolicies: Policy[] = [
  { id: "POL-001", title: "AML Transaction Monitoring Policy",       category: "AML",           status: "Active",       version: "3.2", owner: "M. Chen",   effectiveDate: "Jan 1, 2025",  description: "Defines thresholds, escalation paths, and SAR filing timelines for transaction monitoring alerts." },
  { id: "POL-002", title: "Customer Due Diligence Standard",         category: "KYC",           status: "Active",       version: "2.1", owner: "J. Park",   effectiveDate: "Mar 15, 2025", description: "Sets minimum identification, verification, and periodic review requirements by risk tier." },
  { id: "POL-003", title: "Sanctions Screening & Escalation Policy", category: "Sanctions",     status: "Active",       version: "4.0", owner: "S. Torres", effectiveDate: "Feb 1, 2025",  description: "Governs screening frequency, match adjudication, and mandatory reporting for sanctions hits." },
  { id: "POL-004", title: "Enhanced Due Diligence Framework",        category: "KYC",           status: "Under Review", version: "1.4", owner: "M. Chen",   effectiveDate: "Jun 1, 2024",  description: "Additional diligence requirements for PEPs, high-risk jurisdictions, and complex ownership structures." },
  { id: "POL-005", title: "Cash & CTR Reporting Policy",             category: "CTF",           status: "Active",       version: "2.0", owner: "J. Park",   effectiveDate: "Apr 10, 2025", description: "Defines currency transaction reporting thresholds and structuring detection procedures." },
  { id: "POL-006", title: "Client Data Retention & Privacy Policy",  category: "Data Privacy",  status: "Draft",        version: "0.9", owner: "S. Torres", effectiveDate: "—",            description: "Draft standard for data retention periods and cross-border data handling for client records." },
  { id: "POL-007", title: "Third-Party Risk Assessment Policy",      category: "General",       status: "Archived",     version: "1.0", owner: "M. Chen",   effectiveDate: "Jan 1, 2022",  description: "Superseded by the current vendor due diligence framework." },
];

let seq = initialPolicies.length;
const nextId = () => { seq += 1; return `POL-${String(seq).padStart(3, "0")}`; };

const STATUS_COLOR: Record<Policy["status"], string> = {
  Active: "bg-green-100 text-green-700",
  Draft: "bg-gray-100 text-gray-500",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Archived: "bg-red-50 text-red-500",
};

export function CompliancePoliciesPage({ onBack }: { onBack: () => void }) {
  const [policies, setPolicies] = useState(initialPolicies);
  const [filterCat, setFilterCat] = useState("All");
  const [modalPolicy, setModalPolicy] = useState<Policy | "new" | null>(null);

  const visible = filterCat === "All" ? policies : policies.filter((p) => p.category === filterCat);

  function save(p: Policy) {
    setPolicies((prev) => prev.some((x) => x.id === p.id) ? prev.map((x) => x.id === p.id ? p : x) : [...prev, p]);
    setModalPolicy(null);
  }
  function remove(id: string) {
    if (confirm("Delete this policy? This cannot be undone.")) setPolicies((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Administration</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">Compliance Policies</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Compliance Policies</h2>
          <p className="text-sm text-gray-400 mt-0.5">{policies.length} policies defined</p>
        </div>
        <button onClick={() => setModalPolicy("new")} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> New Policy
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-gray-400">Category:</span>
        {["All", ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${filterCat === c ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visible.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-14 text-center text-gray-400 text-sm">No policies in this category.</div>
        ) : visible.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText size={17} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{p.title}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status]}`}>{p.status}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{p.category}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{p.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-gray-400">
                <span className="font-mono">{p.id}</span>
                <span>·</span><span>v{p.version}</span>
                <span>·</span><span>Owner: {p.owner}</span>
                <span>·</span><span>Effective: {p.effectiveDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setModalPolicy(p)} className="text-gray-300 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
              <button onClick={() => remove(p.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {modalPolicy && <PolicyModal policy={modalPolicy === "new" ? null : modalPolicy} onClose={() => setModalPolicy(null)} onSave={save} />}
    </div>
  );
}

function PolicyModal({ policy, onClose, onSave }: { policy: Policy | null; onClose: () => void; onSave: (p: Policy) => void }) {
  const [title, setTitle] = useState(policy?.title ?? "");
  const [category, setCategory] = useState(policy?.category ?? CATEGORIES[0]);
  const [description, setDescription] = useState(policy?.description ?? "");
  const [status, setStatus] = useState<Policy["status"]>(policy?.status ?? "Draft");
  const [version, setVersion] = useState(policy?.version ?? "1.0");
  const [owner, setOwner] = useState(policy?.owner ?? "");
  const [effectiveDate, setEffectiveDate] = useState(policy?.effectiveDate ?? "");
  const [error, setError] = useState("");

  function handleSave() {
    if (!title.trim()) { setError("Policy title is required."); return; }
    onSave({
      id: policy?.id ?? nextId(), title: title.trim(), category, description: description.trim(),
      status, version: version.trim() || "1.0", owner: owner.trim() || "Unassigned",
      effectiveDate: effectiveDate.trim() || "—",
    });
  }

  return (
    <Modal open onClose={onClose} title={policy ? "Edit Policy" : "New Policy"} width="max-w-lg">
      <div className="flex flex-col gap-4">
        {error && <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <FormField label="Title" required>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </FormField>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Category">
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as Policy["status"])}>
              {(["Draft", "Active", "Under Review", "Archived"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
          <FormField label="Version">
            <input className={inputClass} value={version} onChange={(e) => setVersion(e.target.value)} />
          </FormField>
          <FormField label="Owner">
            <input className={inputClass} value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="e.g. M. Chen" />
          </FormField>
          <FormField label="Effective Date">
            <input className={inputClass} value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} placeholder="e.g. Jan 1, 2026" />
          </FormField>
        </div>
        <FormField label="Description">
          <textarea className={inputClass} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Save Policy</button>
      </ModalFooter>
    </Modal>
  );
}