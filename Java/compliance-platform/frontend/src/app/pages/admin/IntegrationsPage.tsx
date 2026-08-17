import { useState } from "react";
import { ChevronRight, Settings2, CheckCircle2 } from "lucide-react";
import { Modal, ModalFooter, FormField, inputClass } from "../../components/Modal";
import { AiModelProviderPanel } from "../../components/AiModelProviderPanel";

type Integration = {
  id: string; name: string; category: string; description: string;
  enabled: boolean; endpoint: string; apiKey: string; syncFrequency: string;
};

const initialIntegrations: Integration[] = [
  { id: "INT-01", name: "OFAC / Sanctions List Feed",   category: "Screening",     description: "Daily sync of OFAC SDN, EU, and UN consolidated sanctions lists.",  enabled: true,  endpoint: "https://api.sanctions-provider.com/v2/lists", apiKey: "••••••••3f2a", syncFrequency: "Daily" },
  { id: "INT-02", name: "PEP Database",                 category: "Screening",     description: "Politically exposed persons and relationship data provider.",       enabled: true,  endpoint: "https://api.pep-data.com/v1",                 apiKey: "••••••••91bc", syncFrequency: "Daily" },
  { id: "INT-03", name: "Core Banking System",           category: "Data Source",   description: "Transaction and account feed from the client's core banking platform.", enabled: true,  endpoint: "https://core.client-bank.internal/feed",       apiKey: "••••••••7d10", syncFrequency: "Real-time" },
  { id: "INT-04", name: "SAR e-Filing (FinCEN)",         category: "Regulatory",    description: "Electronic filing of Suspicious Activity Reports to FinCEN.",       enabled: false, endpoint: "https://sarx.fincen.gov/api",                  apiKey: "",             syncFrequency: "Manual" },
  { id: "INT-05", name: "Email / SMTP Notifications",    category: "Notifications", description: "Outbound email for alert and case notifications.",                  enabled: true,  endpoint: "smtp://mail.complianceiq.com:587",             apiKey: "••••••••aa02", syncFrequency: "Real-time" },
  { id: "INT-06", name: "Slack / Teams Alerts",          category: "Notifications", description: "Push critical alerts to a Slack or Teams channel.",                 enabled: false, endpoint: "",                                              apiKey: "",             syncFrequency: "Real-time" },
  { id: "INT-07", name: "SIEM / Webhook Export",         category: "Data Export",   description: "Stream audit and alert events to an external SIEM via webhook.",    enabled: true,  endpoint: "https://siem.client-domain.com/ingest",        apiKey: "••••••••4e6f", syncFrequency: "Real-time" },
  { id: "INT-08", name: "Credit Bureau Data",            category: "Data Source",   description: "Third-party credit and identity verification lookups.",             enabled: false, endpoint: "https://api.creditbureau.com/v3",              apiKey: "",             syncFrequency: "On-demand" },
  { id: "INT-09", name: "Case Management Sync",          category: "Data Export",   description: "Two-way sync of cases with an external case management system.",    enabled: true,  endpoint: "https://cms.client-domain.com/api/cases",      apiKey: "••••••••c811", syncFrequency: "Hourly" },
];

export function IntegrationsPage({ onBack }: { onBack: () => void }) {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [modalIntegration, setModalIntegration] = useState<Integration | null>(null);

  function toggle(id: string) {
    setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, enabled: !i.enabled } : i));
  }
  function save(updated: Integration) {
    setIntegrations((prev) => prev.map((i) => i.id === updated.id ? updated : i));
    setModalIntegration(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Administration</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">Integrations</span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Integrations</h2>
        <p className="text-sm text-gray-400 mt-0.5">{integrations.filter((i) => i.enabled).length} of {integrations.length} connections active</p>
      </div>

      <AiModelProviderPanel />

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {integrations.map((i) => (
          <div key={i.id} className={`bg-white rounded-xl border p-5 flex flex-col gap-3 transition-all ${i.enabled ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
            <div className="flex items-start justify-between">
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">{i.category}</span>
              <button
                onClick={() => toggle(i.id)}
                className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${i.enabled ? "bg-blue-600" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${i.enabled ? "left-4" : "left-0.5"}`} />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-900 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{i.name}</span>
                {i.enabled && <CheckCircle2 size={13} className="text-green-500 flex-shrink-0" />}
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">{i.description}</p>
            </div>
            <div className="text-[11px] text-gray-400 font-mono truncate">{i.endpoint || "Not configured"}</div>
            <button
              onClick={() => setModalIntegration(i)}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 rounded-lg py-1.5 hover:bg-blue-50 transition-colors mt-1"
            >
              <Settings2 size={12} /> Configure
            </button>
          </div>
        ))}
      </div>

      {modalIntegration && (
        <IntegrationModal integration={modalIntegration} onClose={() => setModalIntegration(null)} onSave={save} />
      )}
    </div>
  );
}

function IntegrationModal({
  integration, onClose, onSave,
}: { integration: Integration; onClose: () => void; onSave: (i: Integration) => void }) {
  const [endpoint, setEndpoint] = useState(integration.endpoint);
  const [apiKey, setApiKey] = useState(integration.apiKey);
  const [syncFrequency, setSyncFrequency] = useState(integration.syncFrequency);
  const [enabled, setEnabled] = useState(integration.enabled);

  return (
    <Modal open onClose={onClose} title={integration.name} subtitle={integration.description} width="max-w-lg">
      <div className="flex flex-col gap-4">
        <FormField label="Endpoint / URL">
          <input className={inputClass} value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://..." />
        </FormField>
        <FormField label="API Key / Credential">
          <input className={inputClass} type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter to replace existing key" />
        </FormField>
        <FormField label="Sync Frequency">
          <select className={inputClass} value={syncFrequency} onChange={(e) => setSyncFrequency(e.target.value)}>
            {["Real-time", "Hourly", "Daily", "Weekly", "On-demand", "Manual"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </FormField>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded border-gray-300 accent-blue-600" />
          Connection enabled
        </label>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
        <button
          onClick={() => onSave({ ...integration, endpoint, apiKey, syncFrequency, enabled })}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Configuration
        </button>
      </ModalFooter>
    </Modal>
  );
}