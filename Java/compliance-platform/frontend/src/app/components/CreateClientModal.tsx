import { useState } from "react";
import { Modal, ModalFooter, FormField, inputClass } from "./Modal";
import type { Client, ClientDetail } from "../data";

const INDUSTRIES = ["Banking", "Insurance", "Investment", "Brokerage", "Fintech", "Payments"];
const RISK_LEVELS = ["Low", "Medium", "High"];

export type NewClientPayload = { client: Client; detail: ClientDetail };

export function CreateClientModal({
  open, onClose, onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: NewClientPayload) => void;
}) {
  const empty = {
    name: "", industry: INDUSTRIES[0], jurisdiction: "United States",
    street: "", city: "", region: "", postalCode: "", country: "United States",
    registrationNo: "", taxId: "",
    contact: "", email: "", phone: "", accountManager: "",
    risk: "Low",
  };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  function set<K extends keyof typeof empty>(key: K, value: typeof empty[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    if (!form.name.trim()) { setError("Legal name is required."); return; }
    if (!form.contact.trim() || !form.email.trim()) { setError("Primary contact name and email are required."); return; }

    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const client: Client = {
      id: "", // filled in by caller (needs the sequence generator)
      name: form.name.trim(),
      industry: form.industry,
      alerts: 0,
      status: "Active",
      risk: form.risk,
    };
    const detail: ClientDetail = {
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || "—",
      onboarded: today,
      jurisdiction: form.jurisdiction,
      accountManager: form.accountManager.trim() || "Unassigned",
      riskScore: form.risk === "High" ? 78 : form.risk === "Medium" ? 45 : 15,
      lastReview: today,
      nextReview: "—",
      alerts: [],
      cases: [],
      activity: [{ date: today, event: "Client onboarded", user: "Admin User" }],
    };
    onCreate({ client, detail });
    setForm(empty);
    setError("");
  }

  function handleClose() {
    setForm(empty);
    setError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Client" subtitle="Manually enter client details to begin monitoring" width="max-w-2xl">
      <div className="flex flex-col gap-5">
        {error && (
          <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Identification</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Legal Name" required>
              <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Meridian Financial Group" />
            </FormField>
            <FormField label="Industry / Sector">
              <select className={inputClass} value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </FormField>
            <FormField label="Registration No.">
              <input className={inputClass} value={form.registrationNo} onChange={(e) => set("registrationNo", e.target.value)} placeholder="e.g. US-8842104211" />
            </FormField>
            <FormField label="Tax ID (EIN)">
              <input className={inputClass} value={form.taxId} onChange={(e) => set("taxId", e.target.value)} placeholder="e.g. 47-3928012" />
            </FormField>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Address</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Street Address">
              <input className={inputClass} value={form.street} onChange={(e) => set("street", e.target.value)} />
            </FormField>
            <FormField label="City">
              <input className={inputClass} value={form.city} onChange={(e) => set("city", e.target.value)} />
            </FormField>
            <FormField label="State / Region">
              <input className={inputClass} value={form.region} onChange={(e) => set("region", e.target.value)} />
            </FormField>
            <FormField label="Postal Code">
              <input className={inputClass} value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
            </FormField>
            <FormField label="Country / Jurisdiction">
              <input className={inputClass} value={form.country} onChange={(e) => { set("country", e.target.value); set("jurisdiction", e.target.value); }} />
            </FormField>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Primary Contact</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Contact Name" required>
              <input className={inputClass} value={form.contact} onChange={(e) => set("contact", e.target.value)} />
            </FormField>
            <FormField label="Email" required>
              <input className={inputClass} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </FormField>
            <FormField label="Phone">
              <input className={inputClass} value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </FormField>
            <FormField label="Account Manager">
              <input className={inputClass} value={form.accountManager} onChange={(e) => set("accountManager", e.target.value)} placeholder="e.g. M. Chen" />
            </FormField>
          </div>
        </div>

        <div>
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Risk Parameters</div>
          <FormField label="Initial Risk Rating">
            <div className="flex gap-2">
              {RISK_LEVELS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set("risk", r)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                    form.risk === r ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </FormField>
        </div>
      </div>

      <ModalFooter>
        <button onClick={handleClose} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button onClick={handleSubmit} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Create Client
        </button>
      </ModalFooter>
    </Modal>
  );
}