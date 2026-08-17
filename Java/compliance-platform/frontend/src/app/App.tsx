import { useState } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  AlertTriangle, Bell, BookOpen, Building2, ChevronRight,
  FileText, LayoutDashboard, LogOut, Search, Settings, Shield,
  TrendingUp, Users, X, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  AlertCircle, Filter, MoreHorizontal, UserPlus
} from "lucide-react";
import {
  alertsByDay, escalationsTrend, casesByStatus, clients as initialClients, recentAlerts,
  allAlerts, allCases, clientDetails as initialClientDetails, auditEntries,
  STATUS_LOV, SEVERITY_LOV, ALERT_CATEGORIES, CASE_STATUSES, CASE_PRIORITIES, CASE_TYPES,
  initialCaseAlertLinks, nextClientId,
} from "./data";
import type { Client, ClientDetail } from "./data";
import { SeverityBadge, RiskBadge, AlertStatusBadge, CasePriorityBadge, CaseStatusBadge } from "./components/badges";
import { OnboardingPage, type NewClientPayload } from "./pages/OnboardingPage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { UserManagementPage } from "./pages/admin/UserManagementPage";
import { CompliancePoliciesPage } from "./pages/admin/CompliancePoliciesPage";
import { IntegrationsPage } from "./pages/admin/IntegrationsPage";
import { isLoggedIn, getCurrentUsername, logout } from "./lib/apiClient";

// ── Data ─────────────────────────────────────────────────────────────────────
// Mock data lives in ./data.ts (shared with the pages above); a few LOVs and
// the case↔alert linkage below are re-exported here for the pages that stay
// in this file.

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label, value, delta, deltaDir, icon: Icon, color,
}: {
  label: string; value: string; delta: string; deltaDir: "up" | "down"; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}18` }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
      <div className={`flex items-center gap-1 text-xs font-semibold ${deltaDir === "up" ? "text-emerald-600" : "text-red-500"}`}>
        {deltaDir === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {delta} <span className="text-gray-400 font-normal ml-0.5">vs last week</span>
      </div>
    </div>
  );
}

// ── Pages ─────────────────────────────────────────────────────────────────────

function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Alerts" value="299" delta="8.4%" deltaDir="up" icon={Bell} color="#ef4444" />
        <MetricCard label="Open Escalations" value="61" delta="3.2%" deltaDir="up" icon={AlertTriangle} color="#f59e0b" />
        <MetricCard label="Active Cases" value="142" delta="5.1%" deltaDir="down" icon={FileText} color="#3b82f6" />
        <MetricCard label="Monitored Clients" value="48" delta="12.5%" deltaDir="up" icon={Building2} color="#10b981" />
      </div>

      {/* Charts row 1 */}
      <div className="grid xl:grid-cols-3 gap-4">
        {/* Alerts by Day */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Alerts by Day</div>
              <div className="text-xs text-gray-400 mt-0.5">Last 7 days — by severity level</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {[{ label: "Critical", color: "#ef4444" }, { label: "High", color: "#f59e0b" }, { label: "Medium", color: "#3b82f6" }].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={alertsByDay} barSize={10} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="critical" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey="high" stackId="a" fill="#f59e0b" />
              <Bar dataKey="medium" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cases by Status */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Cases Overview</div>
          <div className="text-xs text-gray-400 mb-4">By current status</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={casesByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                {casesByStatus.map((entry, i) => (
                  <Cell key={`case-cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 mt-3">
            {casesByStatus.map(({ name, value, color }) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                  {name}
                </span>
                <span className="font-semibold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid xl:grid-cols-3 gap-4">
        {/* Escalations Trend */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Escalations Trend</div>
              <div className="text-xs text-gray-400 mt-0.5">Open vs resolved — last 7 months</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {[{ label: "Open", color: "#ef4444" }, { label: "Resolved", color: "#10b981" }].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={escalationsTrend}>
              <defs>
                <linearGradient id="esc-open-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="esc-resolved-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
              <Area type="monotone" dataKey="open" stroke="#ef4444" strokeWidth={2} fill="url(#esc-open-grad)" dot={{ r: 3, fill: "#ef4444" }} />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#esc-resolved-grad)" dot={{ r: 3, fill: "#10b981" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Recent Alerts</div>
            <button className="text-xs text-blue-600 font-medium hover:underline">View all</button>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto">
            {recentAlerts.map(({ id, client, type, severity, time }) => (
              <div key={id} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${severity === "Critical" ? "bg-red-500" : severity === "High" ? "bg-orange-400" : "bg-yellow-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{type}</div>
                  <div className="text-[11px] text-gray-400 truncate">{client}</div>
                </div>
                <div className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                  <Clock size={10} />
                  {time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Client Overview Page ──────────────────────────────────────────────────────

type ClientTab = "overview" | "profile" | "cases" | "alerts" | "attributes" | "documents" | "related-entities";

const CLIENT_TABS: { key: ClientTab; label: string }[] = [
  { key: "overview",         label: "Client Overview" },
  { key: "profile",          label: "Client Profile" },
  { key: "cases",            label: "Cases" },
  { key: "alerts",           label: "Alerts" },
  { key: "attributes",       label: "Attributes" },
  { key: "documents",        label: "Documents" },
  { key: "related-entities", label: "Related Entities" },
];

function ClientOverviewPage({
  clientId, clients, clientDetails, onBack,
}: { clientId: string; clients: Client[]; clientDetails: Record<string, ClientDetail>; onBack: () => void }) {
  const client  = clients.find((c) => c.id === clientId)!;
  const details = clientDetails[clientId];
  const [tab, setTab] = useState<ClientTab>("overview");

  const scoreColor = details.riskScore >= 75 ? "#ef4444" : details.riskScore >= 40 ? "#f59e0b" : "#10b981";

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Client List</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-500">{client.id}</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">{client.name}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#0d1526] flex items-center justify-center flex-shrink-0">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{client.name}</h2>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${client.status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                  {client.status}
                </span>
                <RiskBadge risk={client.risk} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-500">
                <span className="font-mono text-xs text-gray-400">{client.id}</span>
                <span>·</span><span>{client.industry}</span>
                <span>·</span><span>{details.jurisdiction}</span>
                <span>·</span><span>Onboarded {details.onboarded}</span>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors self-start">
            Edit Client
          </button>
        </div>

        {/* Tab bar inside header card */}
        <div className="flex gap-1 mt-6 border-b border-gray-100 -mx-6 px-6 overflow-x-auto">
          {CLIENT_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {key === "cases"  ? `Cases (${details.cases.length})` :
               key === "alerts" ? `Alerts (${details.alerts.length})` :
               label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Client Overview ─────────────────────────── */}
      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: "Open Alerts",  value: client.alerts, color: client.alerts > 10 ? "#ef4444" : "#f59e0b", bg: client.alerts > 10 ? "#fef2f2" : "#fffbeb", icon: Bell },
              { label: "Active Cases", value: details.cases.filter((c) => c.status !== "Closed").length, color: "#3b82f6", bg: "#eff6ff", icon: FileText },
              { label: "Total Cases",  value: details.cases.length, color: "#6b7280", bg: "#f9fafb", icon: FileText },
              { label: "Risk Score",   value: details.riskScore, color: scoreColor, bg: `${scoreColor}18`, icon: Shield },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
                  <div className="text-xs text-gray-400 font-medium">{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>Account Summary</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                {[
                  { label: "Primary Contact",  value: details.contact },
                  { label: "Account Manager",  value: details.accountManager },
                  { label: "Last Review",      value: details.lastReview },
                  { label: "Next Review Due",  value: details.nextReview },
                  { label: "Jurisdiction",     value: details.jurisdiction },
                  { label: "Onboarded",        value: details.onboarded },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
                    <div className="text-gray-800 font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col items-center justify-center gap-3">
              <div className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Risk Score</div>
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke={scoreColor} strokeWidth="10"
                    strokeDasharray={`${details.riskScore * 2.513} 251.3`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{details.riskScore}</span>
                  <span className="text-xs text-gray-400">/ 100</span>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]" />Low</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" />Med</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]" />High</span>
              </div>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>Recent Activity</div>
            <div className="flex flex-col gap-4">
              {details.activity.map(({ date, event, user }, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" />
                    {i < details.activity.length - 1 && <div className="w-px flex-1 bg-gray-100 min-h-[20px]" />}
                  </div>
                  <div className="pb-2">
                    <div className="text-sm text-gray-800 font-medium">{event}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{date} · {user}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Client Profile ──────────────────────────── */}
      {tab === "profile" && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
            <div className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Identification</div>
            {[
              { label: "Legal Name",         value: client.name },
              { label: "Client ID",          value: client.id },
              { label: "Entity Type",        value: "Legal Entity" },
              { label: "Industry / Sector",  value: client.industry },
              { label: "Jurisdiction",       value: details.jurisdiction },
              { label: "Registration No.",   value: "US-" + client.id.replace("CL-", "88") + "421" },
              { label: "Tax ID (EIN)",       value: "47-" + client.id.replace("CL-", "3") + "92801" },
              { label: "Date of Onboarding", value: details.onboarded },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 font-medium">{label}</span>
                <span className="text-sm text-gray-800 font-medium text-right max-w-[55%]">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
              <div className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Contact Information</div>
              {[
                { label: "Primary Contact", value: details.contact },
                { label: "Email",           value: details.email },
                { label: "Phone",           value: details.phone },
                { label: "Account Manager", value: details.accountManager },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-400 font-medium">{label}</span>
                  <span className="text-sm text-gray-800 font-medium text-right">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
              <div className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Compliance Status</div>
              {[
                { label: "Risk Rating",     value: <RiskBadge risk={client.risk} /> },
                { label: "Account Status",  value: <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${client.status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{client.status}</span> },
                { label: "Last Review",     value: <span className="text-sm text-gray-800 font-medium">{details.lastReview}</span> },
                { label: "Next Review Due", value: <span className="text-sm text-gray-800 font-medium">{details.nextReview}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-400 font-medium">{label}</span>
                  {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Cases ───────────────────────────────────── */}
      {tab === "cases" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Case ID", "Title", "Type", "Priority", "Status", "Assignee", "Opened", "Due Date"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {details.cases.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400 text-sm">No cases for this client.</td></tr>
              ) : details.cases.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{c.id}</td>
                  <td className="px-5 py-3.5 text-gray-700 max-w-[180px] truncate">{c.title}</td>
                  <td className="px-5 py-3.5"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{c.type}</span></td>
                  <td className="px-5 py-3.5"><CasePriorityBadge priority={c.priority} /></td>
                  <td className="px-5 py-3.5"><CaseStatusBadge status={c.status} /></td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{c.assignee}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{c.opened}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{c.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Alerts ──────────────────────────────────── */}
      {tab === "alerts" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Alert ID", "Type", "Category", "Severity", "Status", "Assignee", "Date"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {details.alerts.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-gray-400 text-sm">No alerts for this client.</td></tr>
              ) : details.alerts.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{a.id}</td>
                  <td className="px-5 py-3.5 text-gray-700 max-w-[200px] truncate">{a.type}</td>
                  <td className="px-5 py-3.5"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{a.category}</span></td>
                  <td className="px-5 py-3.5"><SeverityBadge severity={a.severity} /></td>
                  <td className="px-5 py-3.5"><AlertStatusBadge status={a.status} /></td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{a.assignee}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{a.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Attributes ──────────────────────────────── */}
      {tab === "attributes" && (
        <div className="grid lg:grid-cols-2 gap-4">
          {[
            {
              title: "Business Attributes",
              items: [
                { label: "Business Type",        value: "Financial Institution" },
                { label: "Ownership Structure",  value: "Publicly Traded" },
                { label: "No. of Employees",     value: "1,200 – 5,000" },
                { label: "Annual Revenue",       value: "$250M – $1B" },
                { label: "Years in Operation",   value: "28 years" },
                { label: "Primary Market",       value: "Domestic (US)" },
              ],
            },
            {
              title: "Regulatory Attributes",
              items: [
                { label: "Regulator",            value: "FinCEN / OCC" },
                { label: "License Type",         value: "Federal Banking License" },
                { label: "AML Program",          value: "In Place" },
                { label: "FATF Jurisdiction",    value: "Low Risk" },
                { label: "PEP Flag",             value: "No" },
                { label: "Sanctions Screened",   value: "Yes — Clear" },
              ],
            },
            {
              title: "KYC Attributes",
              items: [
                { label: "KYC Tier",             value: "Enhanced Due Diligence" },
                { label: "CDD Completed",        value: "Yes" },
                { label: "Beneficial Owner",     value: "Identified & Verified" },
                { label: "Source of Funds",      value: "Verified" },
                { label: "Source of Wealth",     value: "Business Revenue" },
                { label: "Customer Since",       value: details.onboarded },
              ],
            },
            {
              title: "Product & Service Attributes",
              items: [
                { label: "Products Used",        value: "Wire Transfer, FX, Custody" },
                { label: "Transaction Volume",   value: "High (>$10M/month)" },
                { label: "Channels",             value: "Online, Branch, API" },
                { label: "Currency",             value: "USD, EUR, GBP" },
                { label: "Cross-Border",         value: "Yes" },
                { label: "Correspondent Banks",  value: "3 active" },
              ],
            },
          ].map(({ title, items }) => (
            <div key={title} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</div>
              <div className="flex flex-col">
                {items.map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400 font-medium">{label}</span>
                    <span className="text-sm text-gray-800 font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Documents ───────────────────────────────── */}
      {tab === "documents" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Uploaded Documents</span>
            <button className="flex items-center gap-2 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
              + Upload
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Document Name", "Type", "Uploaded By", "Upload Date", "Expiry Date", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Certificate of Incorporation", type: "Legal",      by: "M. Chen",   uploaded: "Mar 12, 2021", expiry: "N/A",         status: "Verified" },
                { name: "AML Policy Document",          type: "Compliance", by: "S. Torres", uploaded: "Jan 8, 2024",  expiry: "Jan 8, 2026", status: "Verified" },
                { name: "Beneficial Ownership Form",    type: "KYC",        by: "J. Park",   uploaded: "Apr 15, 2025", expiry: "Apr 15, 2027",status: "Verified" },
                { name: "Board Resolution",             type: "Legal",      by: "M. Chen",   uploaded: "Mar 12, 2021", expiry: "N/A",         status: "Verified" },
                { name: "Annual Report 2024",           type: "Financial",  by: "S. Torres", uploaded: "Feb 20, 2025", expiry: "N/A",         status: "Under Review" },
                { name: "Sanctions Screening Report",   type: "Compliance", by: "System",    uploaded: "Jul 1, 2025",  expiry: "Jan 1, 2026", status: "Verified" },
              ].map((doc) => (
                <tr key={doc.name} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5 text-blue-600 font-medium text-sm hover:underline cursor-pointer">{doc.name}</td>
                  <td className="px-5 py-3.5"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{doc.type}</span></td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{doc.by}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{doc.uploaded}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{doc.expiry}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${doc.status === "Verified" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="text-gray-300 hover:text-gray-600 transition-colors"><MoreHorizontal size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Related Entities ─────────────────────────── */}
      {tab === "related-entities" && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Related Entities</span>
            <button className="flex items-center gap-2 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
              + Link Entity
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                {["Entity Name", "Relationship", "Entity Type", "Jurisdiction", "Risk Level", "Status", ""].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Meridian Capital Holdings LLC",  rel: "Parent Company",       type: "Legal Entity",    juris: "Delaware, US",  risk: "Medium", status: "Active" },
                { name: "Robert Haines",                  rel: "Beneficial Owner",     type: "Individual",      juris: "New York, US",  risk: "Low",    status: "Active" },
                { name: "Sandra Voss",                    rel: "Authorized Signatory", type: "Individual",      juris: "New York, US",  risk: "Low",    status: "Active" },
                { name: "Meridian Cayman Fund I",         rel: "Subsidiary",           type: "Fund",            juris: "Cayman Islands",risk: "High",   status: "Watch" },
                { name: "Global Payments Corp.",          rel: "Correspondent Bank",   type: "Financial Inst.", juris: "United States",  risk: "Low",    status: "Active" },
              ].map((e) => (
                <tr key={e.name} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                  <td className="px-5 py-3.5 text-blue-600 font-medium hover:underline cursor-pointer">{e.name}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{e.rel}</td>
                  <td className="px-5 py-3.5"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{e.type}</span></td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{e.juris}</td>
                  <td className="px-5 py-3.5"><RiskBadge risk={e.risk} /></td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${e.status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button className="text-gray-300 hover:text-gray-600 transition-colors"><MoreHorizontal size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Client List Page ──────────────────────────────────────────────────────────

function ClientListPage({
  clients, onClientSelect,
}: { clients: Client[]; onClientSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.industry.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Client List</h2>
        <p className="text-sm text-gray-400 mt-0.5">{clients.length} monitored entities</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <Search size={15} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
          />
          <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            <Filter size={12} /> Filter
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Client ID", "Name", "Industry", "Open Alerts", "Status", "Risk Level", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => onClientSelect(c.id)}
                    className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors"
                  >
                    {c.id}
                  </button>
                </td>
                <td className="px-5 py-3.5 font-semibold text-gray-800">{c.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{c.industry}</td>
                <td className="px-5 py-3.5">
                  <span className={`font-bold ${c.alerts > 10 ? "text-red-600" : c.alerts > 0 ? "text-orange-500" : "text-gray-400"}`}>
                    {c.alerts}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${c.status === "Active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3.5"><RiskBadge risk={c.risk} /></td>
                <td className="px-5 py-3.5">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors"><MoreHorizontal size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Administration sub-pages ──────────────────────────────────────────────────

type AdminSection = "user-management" | "alert-rules" | "compliance-policies" | "audit-log" | "risk-models" | "integrations";

// ── Audit Log ─────────────────────────────────────────────────────────────────

function AuditLogPage({ onBack }: { onBack: () => void }) {
  const [search, setSearch] = useState("");
  const [filterModel, setFilterModel] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  const models = ["All", ...Array.from(new Set(auditEntries.map((e) => e.model).filter((m) => m !== "—")))];
  const statuses = ["All", "Success", "Match Found", "Flagged", "Triggered"];

  const filtered = auditEntries.filter((e) => {
    const q = search.toLowerCase();
    if (q && !e.user.toLowerCase().includes(q) && !e.action.toLowerCase().includes(q) && !e.entityId.toLowerCase().includes(q)) return false;
    if (filterModel  !== "All" && e.model  !== filterModel)  return false;
    if (filterStatus !== "All" && e.status !== filterStatus) return false;
    return true;
  });

  const statusColor: Record<string, string> = {
    "Success":     "bg-green-100 text-green-700",
    "Match Found": "bg-red-100 text-red-700",
    "Flagged":     "bg-orange-100 text-orange-700",
    "Triggered":   "bg-blue-100 text-blue-700",
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Administration</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">Audit Log</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Audit Log</h2>
          <p className="text-sm text-gray-400 mt-0.5">Model-based action tracking — {filtered.length} entries shown</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user, action, entity ID…" className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent" />
          {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500"><X size={13} /></button>}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400 whitespace-nowrap">Model:</label>
          <select value={filterModel} onChange={(e) => setFilterModel(e.target.value)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {models.map((m) => <option key={m} value={m}>{m === "All" ? "All Models" : m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-400 whitespace-nowrap">Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {statuses.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Timestamp", "User", "Action", "Entity", "Entity ID", "Model", "Status"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">{e.ts}</td>
                <td className="px-5 py-3 text-sm font-medium text-gray-700">{e.user}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{e.action}</td>
                <td className="px-5 py-3"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{e.entity}</span></td>
                <td className="px-5 py-3 font-mono text-xs text-blue-600">{e.entityId}</td>
                <td className="px-5 py-3 text-xs text-gray-500">{e.model}</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusColor[e.status] ?? "bg-gray-100 text-gray-500"}`}>{e.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">{filtered.length} entries</span>
        </div>
      </div>
    </div>
  );
}

// ── Alert Rules Config ────────────────────────────────────────────────────────

type EditableRule = {
  id: string; name: string; category: string; enabled: boolean;
  threshold: number; thresholdUnit: string; score: number; sensitivity: string;
};

const initialAlertRulesList: EditableRule[] = [
  { id: "R-101", name: "Transaction Volume Spike",     category: "AML",       enabled: true,  threshold: 300,  thresholdUnit: "% above baseline", score: 92, sensitivity: "High" },
  { id: "R-112", name: "Multiple Large Credits",       category: "AML",       enabled: true,  threshold: 3,    thresholdUnit: "credits/day",       score: 88, sensitivity: "High" },
  { id: "R-201", name: "AML Threshold Exceeded",       category: "AML",       enabled: true,  threshold: 10000,thresholdUnit: "USD",               score: 85, sensitivity: "High" },
  { id: "R-198", name: "Rapid Sequential Transfers",   category: "AML",       enabled: true,  threshold: 5,    thresholdUnit: "transfers/hour",    score: 78, sensitivity: "High" },
  { id: "R-055", name: "Structuring Pattern",          category: "AML",       enabled: true,  threshold: 9500, thresholdUnit: "USD",               score: 74, sensitivity: "Medium" },
  { id: "R-301", name: "OFAC SDN List Match",          category: "Sanctions", enabled: true,  threshold: 95,   thresholdUnit: "% confidence",      score: 99, sensitivity: "High" },
  { id: "R-302", name: "EU Consolidated Sanctions",    category: "Sanctions", enabled: true,  threshold: 90,   thresholdUnit: "% confidence",      score: 97, sensitivity: "High" },
  { id: "R-210", name: "High-Risk Jurisdiction Wire",  category: "Sanctions", enabled: true,  threshold: 50000,thresholdUnit: "USD",               score: 81, sensitivity: "Medium" },
  { id: "R-401", name: "Large Cash Deposit",           category: "CTF",       enabled: true,  threshold: 20000,thresholdUnit: "USD",               score: 70, sensitivity: "Medium" },
  { id: "R-215", name: "New Counterparty High Value",  category: "AML",       enabled: false, threshold: 25000,thresholdUnit: "USD",               score: 62, sensitivity: "Low" },
  { id: "R-032", name: "PEP Association Flag",         category: "KYC",       enabled: true,  threshold: 80,   thresholdUnit: "% match",           score: 90, sensitivity: "High" },
  { id: "R-071", name: "Cross-Border Wire",            category: "AML",       enabled: true,  threshold: 50000,thresholdUnit: "USD",               score: 68, sensitivity: "Medium" },
  { id: "R-087", name: "High-Risk Counterparty",       category: "Sanctions", enabled: true,  threshold: 85,   thresholdUnit: "% confidence",      score: 77, sensitivity: "High" },
  { id: "R-145", name: "Dormant Account Activity",     category: "KYC",       enabled: true,  threshold: 180,  thresholdUnit: "days inactive",     score: 65, sensitivity: "Medium" },
];

function AlertRulesPage({ onBack }: { onBack: () => void }) {
  const [rules, setRules] = useState<EditableRule[]>(initialAlertRulesList);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftThreshold, setDraftThreshold] = useState("");
  const [draftScore, setDraftScore] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [saved, setSaved] = useState(false);

  const categories = ["All", "AML", "Sanctions", "KYC", "CTF"];
  const visible = filterCat === "All" ? rules : rules.filter((r) => r.category === filterCat);

  function startEdit(r: EditableRule) {
    setEditingId(r.id);
    setDraftThreshold(String(r.threshold));
    setDraftScore(String(r.score));
  }

  function saveEdit(id: string) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, threshold: Number(draftThreshold), score: Number(draftScore) } : r));
    setEditingId(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleEnabled(id: string) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  }

  const sensBg: Record<string, string> = { High: "bg-red-100 text-red-700", Medium: "bg-yellow-100 text-yellow-700", Low: "bg-gray-100 text-gray-500" };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Administration</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">Alert Rules</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Alert Rules</h2>
          <p className="text-sm text-gray-400 mt-0.5">{rules.filter((r) => r.enabled).length} of {rules.length} rules active</p>
        </div>
        {saved && <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">Changes saved</span>}
      </div>

      {/* Category filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-gray-400">Category:</span>
        {categories.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${filterCat === c ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}
          >{c}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["", "Rule ID", "Rule Name", "Category", "Threshold", "Risk Score", "Sensitivity", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const isEditing = editingId === r.id;
              return (
                <tr key={r.id} className={`border-b border-gray-50 transition-colors ${r.enabled ? "hover:bg-blue-50/10" : "opacity-50 bg-gray-50/30"}`}>
                  {/* Toggle */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleEnabled(r.id)}
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${r.enabled ? "bg-blue-600" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${r.enabled ? "left-4" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{r.id}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{r.name}</td>
                  <td className="px-4 py-3"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.category}</span></td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={draftThreshold}
                          onChange={(e) => setDraftThreshold(e.target.value)}
                          className="w-20 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-gray-400">{r.thresholdUnit}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-700 font-medium">{r.threshold.toLocaleString()} <span className="text-xs text-gray-400 font-normal">{r.thresholdUnit}</span></span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0" max="100"
                          value={draftScore}
                          onChange={(e) => setDraftScore(e.target.value)}
                          className="w-16 text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-[10px] text-gray-400">/100</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${r.score}%`, backgroundColor: r.score >= 80 ? "#ef4444" : r.score >= 60 ? "#f59e0b" : "#10b981" }} />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{r.score}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${sensBg[r.sensitivity] ?? ""}`}>{r.sensitivity}</span>
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => saveEdit(r.id)} className="text-xs font-semibold text-white bg-blue-600 px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(r)} className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Risk Models Config ────────────────────────────────────────────────────────

type RiskModel = {
  id: string; name: string; desc: string; category: string;
  enabled: boolean; version: string; lastRun: string;
  thresholds: { label: string; value: number; min: number; max: number; unit: string }[];
};

const initialRiskModels: RiskModel[] = [
  {
    id: "RM-001", name: "AML Transaction Monitoring", category: "AML", enabled: true,
    version: "v4.1", lastRun: "Jul 26, 2025 14:00",
    desc: "Monitors transaction patterns for structuring, layering, and placement. Generates alerts when behaviour deviates from the customer's baseline.",
    thresholds: [
      { label: "Spike Sensitivity (%)", value: 300, min: 100, max: 1000, unit: "%" },
      { label: "Lookback Window (days)", value: 30, min: 7, max: 90, unit: "days" },
      { label: "Min Transaction Size ($)", value: 5000, min: 1000, max: 50000, unit: "USD" },
      { label: "Alert Score Cutoff", value: 65, min: 0, max: 100, unit: "/100" },
    ],
  },
  {
    id: "RM-002", name: "KYC Risk Scoring", category: "KYC", enabled: true,
    version: "v2.8", lastRun: "Jul 26, 2025 06:00",
    desc: "Scores clients across KYC attributes — jurisdiction, entity type, beneficial ownership, source of funds — and updates the risk tier continuously.",
    thresholds: [
      { label: "High Risk Score Floor", value: 75, min: 50, max: 100, unit: "/100" },
      { label: "Medium Risk Floor", value: 40, min: 10, max: 74, unit: "/100" },
      { label: "Review Trigger Delta", value: 10, min: 5, max: 30, unit: "pts" },
      { label: "Periodic Review Interval (days)", value: 180, min: 30, max: 365, unit: "days" },
    ],
  },
  {
    id: "RM-003", name: "Sanctions Screening", category: "Sanctions", enabled: true,
    version: "v1.9", lastRun: "Jul 26, 2025 00:01",
    desc: "Screens clients and counterparties against OFAC SDN, EU Consolidated, UN, and HMT lists. Runs nightly and on every new transaction.",
    thresholds: [
      { label: "Match Confidence Threshold (%)", value: 85, min: 70, max: 100, unit: "%" },
      { label: "Fuzzy Match Tolerance", value: 15, min: 0, max: 30, unit: "%" },
      { label: "Auto-Block Score", value: 95, min: 80, max: 100, unit: "/100" },
    ],
  },
  {
    id: "RM-004", name: "PEP Detection", category: "KYC", enabled: true,
    version: "v3.0", lastRun: "Jul 25, 2025 22:00",
    desc: "Identifies politically exposed persons and their associates through name matching, relationship mapping, and external PEP database integration.",
    thresholds: [
      { label: "Name Match Threshold (%)", value: 80, min: 60, max: 100, unit: "%" },
      { label: "Association Depth (hops)", value: 2, min: 1, max: 4, unit: "hops" },
      { label: "Risk Score on Match", value: 90, min: 50, max: 100, unit: "/100" },
    ],
  },
  {
    id: "RM-005", name: "CTF / Cash Monitoring", category: "CTF", enabled: false,
    version: "v2.0", lastRun: "Jul 24, 2025 08:00",
    desc: "Detects cash transaction patterns related to counter-terrorism financing, including smurfing, repeated small cash deposits, and CTR threshold avoidance.",
    thresholds: [
      { label: "Cash Deposit Threshold ($)", value: 10000, min: 5000, max: 50000, unit: "USD" },
      { label: "Structuring Window (days)", value: 10, min: 3, max: 30, unit: "days" },
      { label: "Alert Score Cutoff", value: 60, min: 0, max: 100, unit: "/100" },
    ],
  },
];

function RiskModelsPage({ onBack }: { onBack: () => void }) {
  const [models, setModels] = useState<RiskModel[]>(initialRiskModels);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggleModel(id: string) {
    setModels((prev) => prev.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m));
  }

  function updateThreshold(modelId: string, idx: number, val: number) {
    setModels((prev) => prev.map((m) => m.id === modelId
      ? { ...m, thresholds: m.thresholds.map((t, i) => i === idx ? { ...t, value: val } : t) }
      : m
    ));
  }

  function saveModel(id: string) {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setExpandedId(null);
  }

  const catColor: Record<string, string> = { AML: "bg-blue-50 text-blue-600", KYC: "bg-purple-50 text-purple-600", Sanctions: "bg-red-50 text-red-600", CTF: "bg-orange-50 text-orange-600" };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Administration</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">Risk Models</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Risk Models</h2>
          <p className="text-sm text-gray-400 mt-0.5">{models.filter((m) => m.enabled).length} of {models.length} models enabled — click a model to configure thresholds</p>
        </div>
        {saved && <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">Configuration saved</span>}
      </div>

      <div className="flex flex-col gap-3">
        {models.map((m) => {
          const isExpanded = expandedId === m.id;
          return (
            <div key={m.id} className={`bg-white rounded-xl border transition-all ${isExpanded ? "border-blue-200 shadow-sm shadow-blue-100" : "border-gray-100"}`}>
              {/* Model header row */}
              <div className="flex items-center gap-4 p-5">
                {/* Toggle */}
                <button
                  onClick={() => toggleModel(m.id)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${m.enabled ? "bg-blue-600" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${m.enabled ? "left-5" : "left-1"}`} />
                </button>

                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.enabled ? catColor[m.category] : "bg-gray-50 text-gray-300"}`}>
                  <TrendingUp size={17} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-gray-900 ${!m.enabled ? "text-gray-400" : ""}`} style={{ fontFamily: "'Outfit', sans-serif" }}>{m.name}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${catColor[m.category] ?? "bg-gray-100 text-gray-500"}`}>{m.category}</span>
                    {!m.enabled && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Disabled</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.version} · Last run: {m.lastRun}</div>
                </div>

                {/* Expand button */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Configure
                  <ChevronRight size={12} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>
              </div>

              {/* Expanded threshold config */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-5">
                  <div className="text-xs text-gray-500 mb-4 leading-relaxed">{m.desc}</div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {m.thresholds.map((t, idx) => (
                      <div key={t.label}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-600">{t.label}</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={t.value}
                              min={t.min}
                              max={t.max}
                              onChange={(e) => updateThreshold(m.id, idx, Number(e.target.value))}
                              className="w-20 text-xs text-right border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-[10px] text-gray-400 min-w-[30px]">{t.unit}</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={t.min}
                          max={t.max}
                          value={t.value}
                          onChange={(e) => updateThreshold(m.id, idx, Number(e.target.value))}
                          className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-blue-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
                          <span>{t.min}</span><span>{t.max}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-5">
                    <button onClick={() => saveModel(m.id)} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Save Configuration
                    </button>
                    <button onClick={() => setExpandedId(null)} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Admin Hub Page ────────────────────────────────────────────────────────────

function AdminPage({ onSectionSelect }: { onSectionSelect: (s: AdminSection) => void }) {
  const sections: { key: AdminSection; icon: React.ElementType; title: string; desc: string; count: string }[] = [
    { key: "user-management",     icon: Users,      title: "User Management",      desc: "Manage analyst accounts, roles, and permissions.",                 count: "12 users" },
    { key: "alert-rules",         icon: Bell,       title: "Alert Rules",           desc: "Configure thresholds, triggers, and notification policies.",       count: "34 rules" },
    { key: "compliance-policies", icon: Shield,     title: "Compliance Policies",   desc: "Define AML, KYC, and reporting policy frameworks.",               count: "8 policies" },
    { key: "audit-log",           icon: BookOpen,   title: "Audit Log",             desc: "Track all system access and action history for regulators.",       count: "2,841 entries" },
    { key: "risk-models",         icon: TrendingUp, title: "Risk Models",           desc: "Tune scoring models and risk appetite parameters.",                count: "5 models" },
    { key: "integrations",        icon: Settings,   title: "Integrations",          desc: "Connect external data sources, SARs filing, and APIs.",           count: "9 active" },
  ];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Administration</h2>
        <p className="text-sm text-gray-400 mt-0.5">System configuration and management</p>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map(({ key, icon: Icon, title, desc, count }) => (
          <div
            key={key}
            onClick={() => onSectionSelect(key)}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Icon size={18} className="text-blue-600" />
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
            </div>
            <div className="font-semibold text-gray-900 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</div>
            <div className="text-xs text-gray-400 leading-relaxed mb-3">{desc}</div>
            <div className="text-xs font-semibold text-blue-600">{count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Alerts Page ───────────────────────────────────────────────────────────────

// Per-alert detection rules
const alertRules: Record<string, { id: string; name: string; category: string; triggered: boolean; score: number; confidence: string }[]> = {
  "ALT-4821": [
    { id: "R-101", name: "Transaction Volume Spike > 300%",   category: "AML",       triggered: true,  score: 92, confidence: "High" },
    { id: "R-112", name: "Multiple Large Credits Same Day",   category: "AML",       triggered: true,  score: 88, confidence: "High" },
    { id: "R-087", name: "High-Risk Counterparty Match",      category: "Sanctions",  triggered: false, score: 0,  confidence: "—" },
    { id: "R-055", name: "Structuring Pattern Detected",      category: "AML",       triggered: true,  score: 74, confidence: "Medium" },
    { id: "R-032", name: "PEP Association Flag",              category: "KYC",       triggered: false, score: 0,  confidence: "—" },
  ],
  "ALT-4820": [
    { id: "R-201", name: "AML Threshold Exceeded (>$10K)",    category: "AML",       triggered: true,  score: 85, confidence: "High" },
    { id: "R-198", name: "Rapid Sequential Transfers",        category: "AML",       triggered: true,  score: 78, confidence: "High" },
    { id: "R-145", name: "Dormant Account Sudden Activity",   category: "KYC",       triggered: false, score: 0,  confidence: "—" },
    { id: "R-071", name: "Cross-Border Wire > $50K",          category: "AML",       triggered: false, score: 0,  confidence: "—" },
  ],
  "ALT-4819": [
    { id: "R-301", name: "OFAC SDN List Exact Match",         category: "Sanctions", triggered: true,  score: 99, confidence: "High" },
    { id: "R-302", name: "EU Consolidated Sanctions Match",   category: "Sanctions", triggered: true,  score: 97, confidence: "High" },
    { id: "R-303", name: "UN Sanctions List Match",           category: "Sanctions", triggered: false, score: 0,  confidence: "—" },
    { id: "R-210", name: "High-Risk Jurisdiction Transfer",   category: "AML",       triggered: true,  score: 81, confidence: "Medium" },
  ],
  "ALT-4818": [
    { id: "R-401", name: "Large Cash Deposit > $20K",         category: "CTF",       triggered: true,  score: 70, confidence: "Medium" },
    { id: "R-402", name: "Structured Deposits Below CTR",     category: "CTF",       triggered: false, score: 0,  confidence: "—" },
    { id: "R-215", name: "New Counterparty High Value",       category: "AML",       triggered: true,  score: 62, confidence: "Medium" },
  ],
};

// Fallback rules for alerts without specific data
const defaultRules = [
  { id: "R-001", name: "Anomalous Behaviour Pattern",       category: "AML",  triggered: true,  score: 75, confidence: "Medium" },
  { id: "R-002", name: "Velocity Check Failed",             category: "AML",  triggered: true,  score: 68, confidence: "Medium" },
  { id: "R-003", name: "Counterparty Risk Threshold",       category: "KYC",  triggered: false, score: 0,  confidence: "—" },
];

// ── Alert Detail Page ─────────────────────────────────────────────────────────

function AlertDetailPage({ alertId, onBack }: { alertId: string; onBack: () => void }) {
  const alert = allAlerts.find((a) => a.id === alertId)!;
  const rules = alertRules[alertId] ?? defaultRules;
  const [detailTab, setDetailTab] = useState<"summary" | "rules">("summary");
  const [currentStatus, setCurrentStatus] = useState(alert.status);

  const triggeredRules = rules.filter((r) => r.triggered);
  const maxScore = Math.max(...rules.map((r) => r.score), 1);
  const overallScore = triggeredRules.length > 0
    ? Math.round(triggeredRules.reduce((s, r) => s + r.score, 0) / triggeredRules.length)
    : 0;

  const narratives: Record<string, string> = {
    "ALT-4821": "An unusual spike in transaction volume was detected for Meridian Financial Group on Jul 26, 2025. The client processed 14 high-value transfers totalling $4.2M within a 6-hour window, representing a 340% increase over the 30-day baseline. Multiple large credits were received from three previously unseen counterparties. The pattern is consistent with layering activity and warrants immediate review.",
    "ALT-4819": "A match against the OFAC SDN list was identified for a counterparty involved in a wire transfer initiated by Crestwood Asset Management. The match confidence is 99% (exact name, DOB, and jurisdiction). All transactions with this counterparty have been flagged. Escalation to the Sanctions team and legal counsel is recommended.",
    "ALT-4820": "Vantage Credit Union triggered an AML threshold breach with seven sequential transfers totalling $87,500 over two business days. The transactions were structured to remain slightly below the $10K CTR threshold, consistent with structuring behaviour. The account has no prior structuring alerts but shows elevated risk indicators from the last periodic review.",
  };
  const narrative = narratives[alertId] ?? `Alert ${alertId} was triggered based on automated rule evaluation for ${alert.client}. The detected pattern — ${alert.type} — exceeds configured risk thresholds for ${alert.category} monitoring. This alert requires analyst review to determine the appropriate disposition and next steps.`;

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Alerts</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-500 font-mono text-xs">{alert.id}</span>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">{alert.type}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{alert.type}</h2>
                <SeverityBadge severity={alert.severity} />
                <AlertStatusBadge status={currentStatus} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                <span className="font-mono text-xs text-gray-400">{alert.id}</span>
                <span>·</span><span>{alert.client}</span>
                <span>·</span><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{alert.category}</span>
                <span>·</span><span className="text-xs text-gray-400">{alert.date}</span>
              </div>
            </div>
          </div>

          {/* Status LOV dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Status</label>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {STATUS_LOV.filter((s) => s.value !== "All").map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-6 border-b border-gray-100 -mx-6 px-6">
          {[
            { key: "summary" as const, label: "Alert Summary" },
            { key: "rules"   as const, label: "Detection / Rules Triggered" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDetailTab(key)}
              className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                detailTab === key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Summary ─────────────────────────────────── */}
      {detailTab === "summary" && (
        <>
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Details grid */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-700 mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>Alert Details</div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { label: "Alert ID",       value: alert.id },
                  { label: "Client",         value: alert.client },
                  { label: "Alert Type",     value: alert.type },
                  { label: "Category",       value: alert.category },
                  { label: "Severity",       value: alert.severity },
                  { label: "Assignee",       value: alert.assignee },
                  { label: "Date Raised",    value: alert.date },
                  { label: "Current Status", value: currentStatus },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-xs text-gray-400 font-medium mb-0.5">{label}</div>
                    <div className="text-sm text-gray-800 font-medium">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk indicators */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
              <div className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Risk Indicators</div>
              {[
                { label: "Overall Risk Score", value: overallScore, max: 100, color: overallScore >= 80 ? "#ef4444" : overallScore >= 50 ? "#f59e0b" : "#10b981" },
                { label: "Rules Triggered",    value: triggeredRules.length, max: rules.length, color: "#3b82f6" },
                { label: "Confidence Level",   value: triggeredRules.length > 0 ? 80 : 30, max: 100, color: "#8b5cf6" },
              ].map(({ label, value, max, color }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-500 font-medium">{label}</span>
                    <span className="font-bold text-gray-800">{value}{label === "Rules Triggered" ? `/${max}` : ""}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(value / max) * 100}%`, backgroundColor: color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Narrative */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Analyst Narrative</div>
            <p className="text-sm text-gray-600 leading-relaxed">{narrative}</p>
          </div>

          {/* Status update panel */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>Update Status</div>
            <div className="flex flex-wrap gap-2">
              {STATUS_LOV.filter((s) => s.value !== "All").map((s) => (
                <button
                  key={s.value}
                  onClick={() => setCurrentStatus(s.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    currentStatus === s.value
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200"
                      : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Detection / Rules Triggered ─────────────── */}
      {detailTab === "rules" && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Rules Evaluated",  value: rules.length,           color: "#6b7280", bg: "#f9fafb" },
              { label: "Rules Triggered",  value: triggeredRules.length,  color: "#ef4444", bg: "#fef2f2" },
              { label: "Overall Risk Score", value: `${overallScore}/100`, color: overallScore >= 80 ? "#ef4444" : "#f59e0b", bg: overallScore >= 80 ? "#fef2f2" : "#fffbeb" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                  <Shield size={16} style={{ color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
                  <div className="text-xs text-gray-400 font-medium">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Rules table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>Detection Rules</span>
              <span className="text-xs text-gray-400">{triggeredRules.length} of {rules.length} triggered</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {["Rule ID", "Rule Name", "Category", "Status", "Risk Score", "Confidence"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className={`border-b border-gray-50 transition-colors ${r.triggered ? "hover:bg-red-50/20" : "hover:bg-gray-50/40 opacity-60"}`}>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{r.id}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{r.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {r.triggered
                        ? <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500" />Triggered</span>
                        : <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-400"><span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Not Triggered</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      {r.triggered ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(r.score / 100) * 100}%`, backgroundColor: r.score >= 80 ? "#ef4444" : r.score >= 60 ? "#f59e0b" : "#10b981" }} />
                          </div>
                          <span className="text-xs font-bold text-gray-700">{r.score}</span>
                        </div>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.triggered ? (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.confidence === "High" ? "bg-red-100 text-red-700" : r.confidence === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                          {r.confidence}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Alerts List Page ──────────────────────────────────────────────────────────

function AlertsPage({ onAlertSelect }: { onAlertSelect: (id: string) => void }) {
  const [search, setSearch]     = useState("");
  const [severity, setSeverity] = useState("All");
  const [status, setStatus]     = useState("All");
  const [category, setCategory] = useState("All");

  const filtered = allAlerts.filter((a) => {
    const q = search.toLowerCase();
    if (q && !a.id.toLowerCase().includes(q) && !a.client.toLowerCase().includes(q) && !a.type.toLowerCase().includes(q)) return false;
    if (severity !== "All" && a.severity !== severity) return false;
    if (status   !== "All" && a.status   !== status)   return false;
    if (category !== "All" && a.category !== category) return false;
    return true;
  });

  const counts = {
    open:      allAlerts.filter((a) => a.status === "Open").length,
    inReview:  allAlerts.filter((a) => a.status === "In Review").length,
    escalated: allAlerts.filter((a) => a.status === "Escalated").length,
    critical:  allAlerts.filter((a) => a.severity === "Critical").length,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header — no Create Alert button */}
      <div>
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Alerts</h2>
        <p className="text-sm text-gray-400 mt-0.5">{filtered.length} of {allAlerts.length} alerts shown</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Open",      value: counts.open,      color: "#3b82f6", bg: "#eff6ff" },
          { label: "In Review", value: counts.inReview,  color: "#f59e0b", bg: "#fffbeb" },
          { label: "Escalated", value: counts.escalated, color: "#ef4444", bg: "#fef2f2" },
          { label: "Critical",  value: counts.critical,  color: "#dc2626", bg: "#fff1f2" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
              <Bell size={16} style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
              <div className="text-xs text-gray-400 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters — dropdowns */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, client, or alert type…"
              className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
            />
            {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500"><X size={13} /></button>}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Alert Type / Category dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-400 whitespace-nowrap">Alert Type:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {ALERT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c === "All" ? "All Types" : c}</option>
              ))}
            </select>
          </div>

          {/* Severity dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-400 whitespace-nowrap">Severity:</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {SEVERITY_LOV.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Status LOV dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-400 whitespace-nowrap">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {STATUS_LOV.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {(severity !== "All" || status !== "All" || category !== "All") && (
            <button
              onClick={() => { setSeverity("All"); setStatus("All"); setCategory("All"); }}
              className="text-xs text-blue-600 hover:underline font-medium ml-1"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Alert ID", "Client", "Type", "Category", "Severity", "Status", "Assignee", "Date"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-5 py-16 text-center text-gray-400 text-sm">No alerts match the current filters.</td></tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => onAlertSelect(a.id)}
                    className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors font-semibold"
                  >
                    {a.id}
                  </button>
                </td>
                <td className="px-4 py-3.5 font-semibold text-gray-800 max-w-[160px] truncate">{a.client}</td>
                <td className="px-4 py-3.5 text-gray-600 max-w-[180px] truncate">{a.type}</td>
                <td className="px-4 py-3.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{a.category}</span>
                </td>
                <td className="px-4 py-3.5"><SeverityBadge severity={a.severity} /></td>
                <td className="px-4 py-3.5"><AlertStatusBadge status={a.status} /></td>
                <td className="px-4 py-3.5 text-xs text-gray-500">{a.assignee}</td>
                <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{a.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          <span className="text-xs text-gray-300">Showing all matches</span>
        </div>
      </div>
    </div>
  );
}

// ── Cases Page ────────────────────────────────────────────────────────────────

function CasesPage({
  caseAlertLinks, onCaseSelect,
}: { caseAlertLinks: Record<string, string[]>; onCaseSelect: (id: string) => void }) {
  const [search, setSearch]     = useState("");
  const [caseStatus, setCaseStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [caseType, setCaseType] = useState("All");

  const filtered = allCases.filter((c) => {
    const q = search.toLowerCase();
    if (q && !c.id.toLowerCase().includes(q) && !c.client.toLowerCase().includes(q) && !c.title.toLowerCase().includes(q)) return false;
    if (caseStatus !== "All" && c.status   !== caseStatus) return false;
    if (priority   !== "All" && c.priority !== priority)   return false;
    if (caseType   !== "All" && c.type     !== caseType)   return false;
    return true;
  });

  const counts = {
    open:      allCases.filter((c) => c.status === "Open").length,
    inReview:  allCases.filter((c) => c.status === "In Review").length,
    escalated: allCases.filter((c) => c.status === "Escalated").length,
    closed:    allCases.filter((c) => c.status === "Closed").length,
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>Cases</h2>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} of {allCases.length} cases shown</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + Open Case
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Open",       value: counts.open,      color: "#3b82f6", bg: "#eff6ff", icon: FileText },
          { label: "In Review",  value: counts.inReview,  color: "#f59e0b", bg: "#fffbeb", icon: AlertCircle },
          { label: "Escalated",  value: counts.escalated, color: "#ef4444", bg: "#fef2f2", icon: AlertTriangle },
          { label: "Closed",     value: counts.closed,    color: "#10b981", bg: "#f0fdf4", icon: CheckCircle2 },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{value}</div>
              <div className="text-xs text-gray-400 font-medium">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by case ID, client, or title…"
              className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
            />
            {search && <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500"><X size={13} /></button>}
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { label: "Status",   values: CASE_STATUSES,   current: caseStatus, set: setCaseStatus },
            { label: "Priority", values: CASE_PRIORITIES, current: priority,   set: setPriority },
            { label: "Type",     values: CASE_TYPES,      current: caseType,   set: setCaseType },
          ].map(({ label, values, current, set }) => (
            <div key={label} className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">{label}:</span>
              {values.map((v) => (
                <button
                  key={v}
                  onClick={() => set(v)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    current === v
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["Case ID", "Client", "Title", "Type", "Priority", "Status", "Assignee", "Opened", "Due Date", "Alerts", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={11} className="px-5 py-16 text-center text-gray-400 text-sm">No cases match the current filters.</td></tr>
            ) : filtered.map((c) => {
              const linkedCount = caseAlertLinks[c.id]?.length ?? c.alerts;
              return (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors">
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => onCaseSelect(c.id)}
                    className="font-mono text-xs text-blue-600 hover:text-blue-800 hover:underline underline-offset-2 transition-colors font-semibold"
                  >
                    {c.id}
                  </button>
                </td>
                <td className="px-4 py-3.5 font-semibold text-gray-800 max-w-[140px] truncate">{c.client}</td>
                <td className="px-4 py-3.5 text-gray-600 max-w-[180px] truncate">
                  <button onClick={() => onCaseSelect(c.id)} className="hover:text-blue-600 hover:underline text-left transition-colors">{c.title}</button>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{c.type}</span>
                </td>
                <td className="px-4 py-3.5"><CasePriorityBadge priority={c.priority} /></td>
                <td className="px-4 py-3.5"><CaseStatusBadge status={c.status} /></td>
                <td className="px-4 py-3.5 text-xs text-gray-500">{c.assignee}</td>
                <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{c.opened}</td>
                <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                  <span className={c.status !== "Closed" && new Date(c.due) < new Date() ? "text-red-500 font-semibold" : "text-gray-400"}>
                    {c.due}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`font-bold text-sm ${linkedCount > 3 ? "text-red-500" : linkedCount > 0 ? "text-orange-400" : "text-gray-300"}`}>
                    {linkedCount}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <button onClick={() => onCaseSelect(c.id)} className="text-gray-300 hover:text-gray-600 transition-colors"><MoreHorizontal size={15} /></button>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          <span className="text-xs text-gray-300">Showing all matches</span>
        </div>
      </div>
    </div>
  );
}

// ── Nav config ─────────────────────────────────────────────────────────────────

const NAV: { key: string; label: string; icon: React.ElementType; badge?: string }[] = [
  { key: "dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { key: "alerts",         label: "Alerts",          icon: Bell },
  { key: "cases",          label: "Cases",           icon: FileText },
  { key: "clients",        label: "Client List",     icon: Building2 },
  { key: "onboarding",     label: "Onboarding",      icon: UserPlus },
];

// Rendered on the right side of the nav row, separated from the primary
// section links above — it's a settings/admin destination, not a workflow.
const NAV_RIGHT: { key: string; label: string; icon: React.ElementType; badge?: string }[] = [
  { key: "administration", label: "Administration",  icon: Settings },
];

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  // Restored from sessionStorage on load (see apiClient.ts) so a page
  // refresh doesn't bounce a still-logged-in user back to LoginPage.
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn);
  const [currentUser, setCurrentUser]         = useState(() => getCurrentUsername() ?? "");

  const [active, setActive]                     = useState("dashboard");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId]   = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId]     = useState<string | null>(null);
  const [adminSection, setAdminSection]         = useState<AdminSection | null>(null);

  const [clients, setClients]             = useState<Client[]>(initialClients);
  const [clientDetails, setClientDetails] = useState<Record<string, ClientDetail>>(initialClientDetails);
  const [caseAlertLinks, setCaseAlertLinks] = useState<Record<string, string[]>>(initialCaseAlertLinks);

  function handleLogin(username: string) { setCurrentUser(username); setIsAuthenticated(true); }
  function handleLogout() {
    logout();
    setIsAuthenticated(false); setCurrentUser("");
    setActive("dashboard"); setSelectedClientId(null); setSelectedAlertId(null); setSelectedCaseId(null); setAdminSection(null);
  }

  function handleClientSelect(id: string) { setSelectedClientId(id); setActive("client-overview"); }
  function handleClientBack()             { setSelectedClientId(null); setActive("clients"); }
  function handleAlertSelect(id: string)  { setSelectedAlertId(id);   setActive("alert-detail"); }
  function handleAlertBack()              { setSelectedAlertId(null);  setActive("alerts"); }
  function handleCaseSelect(id: string)   { setSelectedCaseId(id);    setActive("case-detail"); }
  function handleCaseBack()               { setSelectedCaseId(null);   setActive("cases"); }
  function handleAdminSection(s: AdminSection) { setAdminSection(s); setActive("administration"); }
  function handleAdminBack()              { setAdminSection(null); setActive("administration"); }

  function handleCreateClient(payload: NewClientPayload) {
    const id = nextClientId();
    const client: Client = { ...payload.client, id };
    setClients((prev) => [...prev, client]);
    setClientDetails((prev) => ({ ...prev, [id]: payload.detail }));
    handleClientSelect(id);
  }

  // Existing-client path through Onboarding: the questionnaire was
  // refreshed rather than a new client created, so update in place instead
  // of appending.
  function handleUpdateClientFromOnboarding(clientId: string, risk: string, detail: ClientDetail) {
    setClients((prev) => prev.map((c) => (c.id === clientId ? { ...c, risk } : c)));
    setClientDetails((prev) => ({ ...prev, [clientId]: detail }));
    handleClientSelect(clientId);
  }

  function handleAttachAlerts(caseId: string, alertIds: string[]) {
    setCaseAlertLinks((prev) => ({
      ...prev,
      [caseId]: Array.from(new Set([...(prev[caseId] ?? []), ...alertIds])),
    }));
  }
  function handleRemoveAlertFromCase(caseId: string, alertId: string) {
    setCaseAlertLinks((prev) => ({ ...prev, [caseId]: (prev[caseId] ?? []).filter((id) => id !== alertId) }));
  }

  function renderAdminSection() {
    switch (adminSection) {
      case "audit-log":            return <AuditLogPage onBack={handleAdminBack} />;
      case "alert-rules":          return <AlertRulesPage onBack={handleAdminBack} />;
      case "risk-models":          return <RiskModelsPage onBack={handleAdminBack} />;
      case "user-management":      return <UserManagementPage onBack={handleAdminBack} />;
      case "compliance-policies":  return <CompliancePoliciesPage onBack={handleAdminBack} />;
      case "integrations":         return <IntegrationsPage onBack={handleAdminBack} />;
      default:                     return <AdminPage onSectionSelect={handleAdminSection} />;
    }
  }

  function renderPage() {
    switch (active) {
      case "dashboard":
        return <DashboardPage />;
      case "clients":
        return <ClientListPage clients={clients} onClientSelect={handleClientSelect} />;
      case "client-overview":
        return selectedClientId
          ? <ClientOverviewPage clientId={selectedClientId} clients={clients} clientDetails={clientDetails} onBack={handleClientBack} />
          : <ClientListPage clients={clients} onClientSelect={handleClientSelect} />;
      case "onboarding":
        return (
          <OnboardingPage
            clients={clients}
            clientDetails={clientDetails}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClientFromOnboarding}
          />
        );
      case "administration":
        return renderAdminSection();
      case "alerts":
        return <AlertsPage onAlertSelect={handleAlertSelect} />;
      case "alert-detail":
        return selectedAlertId ? <AlertDetailPage alertId={selectedAlertId} onBack={handleAlertBack} /> : <AlertsPage onAlertSelect={handleAlertSelect} />;
      case "cases":
        return <CasesPage caseAlertLinks={caseAlertLinks} onCaseSelect={handleCaseSelect} />;
      case "case-detail":
        return selectedCaseId
          ? <CaseDetailPage caseId={selectedCaseId} attachedAlertIds={caseAlertLinks[selectedCaseId] ?? []} onAttachAlerts={handleAttachAlerts} onRemoveAlert={handleRemoveAlertFromCase} onBack={handleCaseBack} />
          : <CasesPage caseAlertLinks={caseAlertLinks} onCaseSelect={handleCaseSelect} />;
      default:
        return <DashboardPage />;
    }
  }

  const currentNav = NAV.find((n) => n.key === active) ?? NAV_RIGHT.find((n) => n.key === active);

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-[#f1f3f7] overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top Navigation ──────────────────────────────── */}
      <header className="bg-[#0d1526] flex-shrink-0">
        {/* Brand + utilities row */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Shield size={14} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-none" style={{ fontFamily: "'Outfit', sans-serif" }}>ComplianceIQ</div>
              <div className="text-white/30 text-[10px]">Risk &amp; Monitoring</div>
            </div>
          </div>

          {/* Right utilities */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 w-52">
              <Search size={13} className="text-white/30 flex-shrink-0" />
              <input placeholder="Search…" className="text-sm bg-transparent outline-none flex-1 placeholder-white/30 text-white/70" />
            </div>

            {/* Bell */}
            <button className="relative w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 transition-colors">
              <Bell size={15} />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">5</span>
            </button>

            {/* Date */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-white/30 border border-white/10 rounded-lg px-2.5 py-1.5">
              <Clock size={11} />
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-1">
              <div className="w-7 h-7 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">
                {(currentUser.trim()[0] ?? "U").toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold text-white leading-none">{currentUser || "User"}</div>
                <div className="text-[10px] text-white/30 mt-0.5">Compliance Officer</div>
              </div>
              <button onClick={handleLogout} title="Sign out" className="text-white/25 hover:text-white/60 transition-colors ml-1">
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Nav items row */}
        <nav className="flex items-center gap-1 px-4 overflow-x-auto">
          {NAV.map(({ key, label, icon: Icon, badge }) => {
            const isActive = active === key
              || (key === "clients" && active === "client-overview")
              || (key === "alerts"  && active === "alert-detail")
              || (key === "cases"   && active === "case-detail");
            return (
              <button
                key={key}
                onClick={() => {
                  setActive(key);
                  if (key !== "clients") setSelectedClientId(null);
                  if (key !== "alerts")  setSelectedAlertId(null);
                  if (key !== "cases")   setSelectedCaseId(null);
                  setAdminSection(null);
                }}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-blue-500 text-white"
                    : "border-transparent text-white/45 hover:text-white/75 hover:border-white/20"
                }`}
              >
                <Icon size={15} className="flex-shrink-0" />
                {label}
                {badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-blue-500/40 text-white" : "bg-red-500 text-white"}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}

          {NAV_RIGHT.map(({ key, label, icon: Icon, badge }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActive(key);
                  setSelectedClientId(null);
                  setSelectedAlertId(null);
                  setSelectedCaseId(null);
                  setAdminSection(null);
                }}
                className={`ml-auto flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive
                    ? "border-blue-500 text-white"
                    : "border-transparent text-white/45 hover:text-white/75 hover:border-white/20"
                }`}
              >
                <Icon size={15} className="flex-shrink-0" />
                {label}
                {badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-blue-500/40 text-white" : "bg-red-500 text-white"}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Breadcrumb bar */}
      <div className="flex items-center gap-1.5 px-6 py-2.5 bg-white border-b border-gray-100 text-xs text-gray-400">
        <span>Home</span>
        <ChevronRight size={10} />
        {active === "client-overview" ? (
          <>
            <button onClick={handleClientBack} className="hover:text-blue-500 transition-colors">Client List</button>
            <ChevronRight size={10} />
            <span className="text-gray-700 font-medium">{selectedClientId}</span>
          </>
        ) : active === "alert-detail" && selectedAlertId ? (
          <>
            <button onClick={handleAlertBack} className="hover:text-blue-500 transition-colors">Alerts</button>
            <ChevronRight size={10} />
            <span className="font-mono text-gray-500">{selectedAlertId}</span>
            <ChevronRight size={10} />
            <span className="text-gray-700 font-medium">{allAlerts.find((a) => a.id === selectedAlertId)?.type ?? "Detail"}</span>
          </>
        ) : active === "case-detail" && selectedCaseId ? (
          <>
            <button onClick={handleCaseBack} className="hover:text-blue-500 transition-colors">Cases</button>
            <ChevronRight size={10} />
            <span className="font-mono text-gray-500">{selectedCaseId}</span>
            <ChevronRight size={10} />
            <span className="text-gray-700 font-medium">{allCases.find((c) => c.id === selectedCaseId)?.title ?? "Detail"}</span>
          </>
        ) : active === "administration" && adminSection ? (
          <>
            <button onClick={handleAdminBack} className="hover:text-blue-500 transition-colors">Administration</button>
            <ChevronRight size={10} />
            <span className="text-gray-700 font-medium">
              {{ "audit-log": "Audit Log", "alert-rules": "Alert Rules", "risk-models": "Risk Models", "user-management": "User Management", "compliance-policies": "Compliance Policies", "integrations": "Integrations" }[adminSection] ?? adminSection}
            </span>
          </>
        ) : (
          <span className="text-gray-700 font-medium">{currentNav?.label}</span>
        )}
      </div>

      {/* ── Page content ────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        {renderPage()}
      </main>
    </div>
  );
}
