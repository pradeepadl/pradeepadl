// ── Shared mock data & types ────────────────────────────────────────────────
// Extracted out of App.tsx so new page modules (case detail, admin sections,
// the create-client modal, etc.) can import what they need without a
// circular dependency back on App.tsx.

export const alertsByDay = [
  { day: "Mon", critical: 12, high: 28, medium: 44 },
  { day: "Tue", critical: 19, high: 35, medium: 52 },
  { day: "Wed", critical: 8,  high: 22, medium: 61 },
  { day: "Thu", critical: 24, high: 41, medium: 38 },
  { day: "Fri", critical: 17, high: 30, medium: 55 },
  { day: "Sat", critical: 6,  high: 14, medium: 29 },
  { day: "Sun", critical: 4,  high: 10, medium: 21 },
];

export const escalationsTrend = [
  { month: "Jan", open: 34, resolved: 28 },
  { month: "Feb", open: 41, resolved: 35 },
  { month: "Mar", open: 38, resolved: 42 },
  { month: "Apr", open: 52, resolved: 44 },
  { month: "May", open: 47, resolved: 51 },
  { month: "Jun", open: 61, resolved: 53 },
  { month: "Jul", open: 55, resolved: 60 },
];

export const casesByStatus = [
  { name: "Open", value: 142, color: "#3b82f6" },
  { name: "In Review", value: 87,  color: "#f59e0b" },
  { name: "Escalated", value: 34,  color: "#ef4444" },
  { name: "Closed", value: 228, color: "#10b981" },
];

export const clients = [
  { id: "CL-001", name: "Meridian Financial Group", industry: "Banking", alerts: 14, status: "Active", risk: "High" },
  { id: "CL-002", name: "Apex Insurance Partners", industry: "Insurance", alerts: 3,  status: "Active", risk: "Low" },
  { id: "CL-003", name: "Crestwood Asset Management", industry: "Investment", alerts: 8,  status: "Active", risk: "Medium" },
  { id: "CL-004", name: "Vantage Credit Union", industry: "Banking", alerts: 21, status: "Watch", risk: "High" },
  { id: "CL-005", name: "Solaris Trading LLC", industry: "Brokerage", alerts: 0,  status: "Active", risk: "Low" },
  { id: "CL-006", name: "Northern Trust Advisory", industry: "Investment", alerts: 6,  status: "Active", risk: "Medium" },
];
export type Client = typeof clients[number];

export const recentAlerts = [
  { id: "ALT-4821", client: "Meridian Financial Group", type: "Unusual Transaction Volume", severity: "Critical", time: "2m ago" },
  { id: "ALT-4820", client: "Vantage Credit Union", type: "AML Threshold Breach", severity: "High", time: "18m ago" },
  { id: "ALT-4819", client: "Crestwood Asset Management", type: "Sanctions List Match", severity: "Critical", time: "34m ago" },
  { id: "ALT-4818", client: "Northern Trust Advisory", type: "Large Cash Deposit", severity: "Medium", time: "1h ago" },
  { id: "ALT-4817", client: "Apex Insurance Partners", type: "PEP Relationship Detected", severity: "High", time: "2h ago" },
];

// ── Alerts mock data ──────────────────────────────────────────────────────────
export const allAlerts = [
  { id: "ALT-4821", client: "Meridian Financial Group",   type: "Unusual Transaction Volume",  severity: "Critical", status: "Open",        assignee: "J. Park",     date: "Jul 26, 2025", category: "AML" },
  { id: "ALT-4820", client: "Vantage Credit Union",       type: "AML Threshold Breach",         severity: "High",     status: "In Review",   assignee: "S. Torres",   date: "Jul 26, 2025", category: "AML" },
  { id: "ALT-4819", client: "Crestwood Asset Management", type: "Sanctions List Match",          severity: "Critical", status: "Escalated",   assignee: "M. Chen",     date: "Jul 25, 2025", category: "Sanctions" },
  { id: "ALT-4818", client: "Northern Trust Advisory",    type: "Large Cash Deposit",            severity: "Medium",   status: "Open",        assignee: "Unassigned",  date: "Jul 25, 2025", category: "CTF" },
  { id: "ALT-4817", client: "Apex Insurance Partners",    type: "PEP Relationship Detected",     severity: "High",     status: "In Review",   assignee: "J. Park",     date: "Jul 24, 2025", category: "KYC" },
  { id: "ALT-4816", client: "Solaris Trading LLC",        type: "Structuring Pattern",           severity: "High",     status: "Open",        assignee: "S. Torres",   date: "Jul 24, 2025", category: "AML" },
  { id: "ALT-4815", client: "Meridian Financial Group",   type: "High-Risk Jurisdiction Wire",   severity: "Critical", status: "Escalated",   assignee: "M. Chen",     date: "Jul 23, 2025", category: "Sanctions" },
  { id: "ALT-4814", client: "Vantage Credit Union",       type: "Velocity Check Failed",         severity: "Medium",   status: "Closed",      assignee: "J. Park",     date: "Jul 23, 2025", category: "AML" },
  { id: "ALT-4813", client: "Northern Trust Advisory",    type: "Adverse Media Hit",             severity: "High",     status: "Closed",      assignee: "S. Torres",   date: "Jul 22, 2025", category: "KYC" },
  { id: "ALT-4812", client: "Crestwood Asset Management", type: "Round-Trip Transaction",        severity: "Medium",   status: "Open",        assignee: "Unassigned",  date: "Jul 22, 2025", category: "AML" },
  { id: "ALT-4811", client: "Apex Insurance Partners",    type: "Dormant Account Reactivated",   severity: "Low",      status: "Closed",      assignee: "M. Chen",     date: "Jul 21, 2025", category: "KYC" },
  { id: "ALT-4810", client: "Solaris Trading LLC",        type: "Offshore Counterparty",         severity: "High",     status: "In Review",   assignee: "J. Park",     date: "Jul 21, 2025", category: "Sanctions" },
];
export type AlertItem = typeof allAlerts[number];

// ── Cases mock data ───────────────────────────────────────────────────────────
export const allCases = [
  { id: "CSE-0291", client: "Meridian Financial Group",   title: "Q3 AML Investigation",           status: "Open",      priority: "High",    assignee: "M. Chen",    opened: "Jul 10, 2025", due: "Aug 10, 2025", type: "AML",       alerts: 4 },
  { id: "CSE-0290", client: "Vantage Credit Union",       title: "SAR Filing — Structuring",        status: "In Review", priority: "Critical",assignee: "J. Park",    opened: "Jul 14, 2025", due: "Jul 28, 2025", type: "SAR",       alerts: 7 },
  { id: "CSE-0289", client: "Crestwood Asset Management", title: "Sanctions Screening Review",      status: "Escalated", priority: "Critical",assignee: "S. Torres",  opened: "Jul 18, 2025", due: "Jul 27, 2025", type: "Sanctions",  alerts: 3 },
  { id: "CSE-0288", client: "Northern Trust Advisory",    title: "KYC Refresh — High Risk Tier",   status: "Open",      priority: "Medium",  assignee: "Unassigned", opened: "Jul 19, 2025", due: "Aug 19, 2025", type: "KYC",       alerts: 1 },
  { id: "CSE-0287", client: "Apex Insurance Partners",    title: "PEP Enhanced Due Diligence",      status: "In Review", priority: "High",    assignee: "M. Chen",    opened: "Jul 20, 2025", due: "Aug 3, 2025",  type: "EDD",       alerts: 2 },
  { id: "CSE-0286", client: "Solaris Trading LLC",        title: "Offshore Wire Investigation",     status: "Open",      priority: "High",    assignee: "J. Park",    opened: "Jul 21, 2025", due: "Aug 14, 2025", type: "AML",       alerts: 5 },
  { id: "CSE-0285", client: "Meridian Financial Group",   title: "Beneficial Ownership Update",     status: "Closed",    priority: "Low",     assignee: "S. Torres",  opened: "Jun 30, 2025", due: "Jul 21, 2025", type: "KYC",       alerts: 0 },
  { id: "CSE-0284", client: "Vantage Credit Union",       title: "Large Cash Reporting",            status: "Closed",    priority: "Medium",  assignee: "M. Chen",    opened: "Jul 1, 2025",  due: "Jul 15, 2025", type: "CTF",       alerts: 2 },
  { id: "CSE-0283", client: "Northern Trust Advisory",    title: "Adverse Media — Fund Manager",    status: "Closed",    priority: "High",    assignee: "J. Park",    opened: "Jul 5, 2025",  due: "Jul 20, 2025", type: "EDD",       alerts: 1 },
];
export type CaseRecord = typeof allCases[number];

// Which alerts are currently attached to which case, for investigation.
// Seeded from alerts that share the case's client, roughly matching each
// case's original `alerts` count above (this is demo data — nothing here
// is meant to reconcile exactly).
export const initialCaseAlertLinks: Record<string, string[]> = {
  "CSE-0291": ["ALT-4821", "ALT-4815"],
  "CSE-0290": ["ALT-4820", "ALT-4814"],
  "CSE-0289": ["ALT-4819", "ALT-4812"],
  "CSE-0288": ["ALT-4818", "ALT-4813"],
  "CSE-0287": ["ALT-4817", "ALT-4811"],
  "CSE-0286": ["ALT-4816", "ALT-4810"],
  "CSE-0285": [],
  "CSE-0284": ["ALT-4814"],
  "CSE-0283": ["ALT-4813"],
};

export type ClientDetail = {
  contact: string; email: string; phone: string; onboarded: string; jurisdiction: string; accountManager: string;
  riskScore: number; lastReview: string; nextReview: string;
  alerts: AlertItem[]; cases: CaseRecord[];
  activity: { date: string; event: string; user: string }[];
};

export const clientDetails: Record<string, ClientDetail> = {
  "CL-001": {
    contact: "Robert Haines", email: "r.haines@meridianfg.com", phone: "+1 212 555 0142",
    onboarded: "Mar 12, 2021", jurisdiction: "United States", accountManager: "M. Chen",
    riskScore: 82, lastReview: "Apr 15, 2025", nextReview: "Oct 15, 2025",
    alerts: allAlerts.filter((a) => a.client === "Meridian Financial Group"),
    cases:  allCases.filter((c)  => c.client  === "Meridian Financial Group"),
    activity: [
      { date: "Jul 26, 2025", event: "Critical alert raised: Unusual Transaction Volume", user: "System" },
      { date: "Jul 25, 2025", event: "Case CSE-0291 updated — additional documents requested", user: "M. Chen" },
      { date: "Jul 15, 2025", event: "Annual KYC review initiated", user: "J. Park" },
      { date: "Jun 30, 2025", event: "Risk score updated from 74 → 82", user: "System" },
    ],
  },
  "CL-002": {
    contact: "Diana Walsh", email: "d.walsh@apexins.com", phone: "+1 312 555 0871",
    onboarded: "Jun 8, 2022", jurisdiction: "United States", accountManager: "J. Park",
    riskScore: 28, lastReview: "May 2, 2025", nextReview: "Nov 2, 2025",
    alerts: allAlerts.filter((a) => a.client === "Apex Insurance Partners"),
    cases:  allCases.filter((c)  => c.client  === "Apex Insurance Partners"),
    activity: [
      { date: "Jul 24, 2025", event: "PEP alert raised and assigned to J. Park", user: "System" },
      { date: "Jul 20, 2025", event: "EDD case CSE-0287 opened", user: "M. Chen" },
      { date: "May 2, 2025",  event: "Periodic review completed — risk score unchanged", user: "J. Park" },
    ],
  },
  "CL-003": {
    contact: "Sung-Min Yoo", email: "sm.yoo@crestwoodam.com", phone: "+1 415 555 0334",
    onboarded: "Jan 19, 2020", jurisdiction: "United States", accountManager: "S. Torres",
    riskScore: 55, lastReview: "Mar 10, 2025", nextReview: "Sep 10, 2025",
    alerts: allAlerts.filter((a) => a.client === "Crestwood Asset Management"),
    cases:  allCases.filter((c)  => c.client  === "Crestwood Asset Management"),
    activity: [
      { date: "Jul 25, 2025", event: "Sanctions match escalated — case CSE-0289 opened", user: "S. Torres" },
      { date: "Jul 22, 2025", event: "Round-trip transaction alert flagged", user: "System" },
      { date: "Mar 10, 2025", event: "Periodic review completed — risk upgraded to Medium", user: "S. Torres" },
    ],
  },
  "CL-004": {
    contact: "Patricia Grant", email: "p.grant@vantagecredit.com", phone: "+1 713 555 0219",
    onboarded: "Sep 3, 2019", jurisdiction: "United States", accountManager: "M. Chen",
    riskScore: 91, lastReview: "Feb 28, 2025", nextReview: "Aug 28, 2025",
    alerts: allAlerts.filter((a) => a.client === "Vantage Credit Union"),
    cases:  allCases.filter((c)  => c.client  === "Vantage Credit Union"),
    activity: [
      { date: "Jul 26, 2025", event: "AML threshold breach — alert escalated", user: "System" },
      { date: "Jul 14, 2025", event: "SAR filing case CSE-0290 opened", user: "J. Park" },
      { date: "Feb 28, 2025", event: "Risk score upgraded to High (91)", user: "System" },
      { date: "Feb 20, 2025", event: "Enhanced monitoring status applied", user: "M. Chen" },
    ],
  },
  "CL-005": {
    contact: "Tariq Bellamy", email: "t.bellamy@solaristrade.com", phone: "+1 646 555 0783",
    onboarded: "Nov 14, 2023", jurisdiction: "United States", accountManager: "J. Park",
    riskScore: 19, lastReview: "Jun 1, 2025", nextReview: "Dec 1, 2025",
    alerts: allAlerts.filter((a) => a.client === "Solaris Trading LLC"),
    cases:  allCases.filter((c)  => c.client  === "Solaris Trading LLC"),
    activity: [
      { date: "Jul 24, 2025", event: "Structuring pattern alert opened", user: "System" },
      { date: "Jul 21, 2025", event: "Offshore wire investigation case opened", user: "J. Park" },
      { date: "Jun 1, 2025",  event: "Annual onboarding review completed", user: "J. Park" },
    ],
  },
  "CL-006": {
    contact: "Amara Osei", email: "a.osei@northerntrust.com", phone: "+1 312 555 0562",
    onboarded: "Apr 7, 2021", jurisdiction: "United States", accountManager: "S. Torres",
    riskScore: 47, lastReview: "May 20, 2025", nextReview: "Nov 20, 2025",
    alerts: allAlerts.filter((a) => a.client === "Northern Trust Advisory"),
    cases:  allCases.filter((c)  => c.client  === "Northern Trust Advisory"),
    activity: [
      { date: "Jul 25, 2025", event: "Large cash deposit alert raised", user: "System" },
      { date: "Jul 5, 2025",  event: "Adverse media case CSE-0283 closed", user: "J. Park" },
      { date: "May 20, 2025", event: "Periodic review completed — no changes", user: "S. Torres" },
    ],
  },
};

// ── Audit log ──────────────────────────────────────────────────────────────────
export const auditEntries = [
  { ts: "2025-07-26 14:32:01", user: "M. Chen",    action: "Status Update",     entity: "Alert",  entityId: "ALT-4821", model: "Rule Engine v3.2",   status: "Success" },
  { ts: "2025-07-26 14:28:44", user: "System",      action: "Alert Generated",   entity: "Alert",  entityId: "ALT-4821", model: "AML-TM Model v4.1",  status: "Success" },
  { ts: "2025-07-26 13:55:12", user: "J. Park",     action: "Case Updated",      entity: "Case",   entityId: "CSE-0291", model: "—",                  status: "Success" },
  { ts: "2025-07-26 13:40:07", user: "System",      action: "Risk Score Recalc", entity: "Client", entityId: "CL-004",   model: "Risk Scoring v2.8",  status: "Success" },
  { ts: "2025-07-26 13:12:30", user: "S. Torres",   action: "Case Escalated",    entity: "Case",   entityId: "CSE-0289", model: "—",                  status: "Success" },
  { ts: "2025-07-26 12:58:00", user: "System",      action: "Sanctions Screen",  entity: "Alert",  entityId: "ALT-4819", model: "Sanctions v1.9",     status: "Match Found" },
  { ts: "2025-07-26 12:31:17", user: "M. Chen",     action: "Login",             entity: "User",   entityId: "USR-003",  model: "—",                  status: "Success" },
  { ts: "2025-07-26 11:47:05", user: "J. Park",     action: "Login",             entity: "User",   entityId: "USR-001",  model: "—",                  status: "Success" },
  { ts: "2025-07-26 11:20:44", user: "System",      action: "Alert Generated",   entity: "Alert",  entityId: "ALT-4820", model: "AML-TM Model v4.1",  status: "Success" },
  { ts: "2025-07-26 10:55:23", user: "System",      action: "CTR Threshold Chk", entity: "Alert",  entityId: "ALT-4818", model: "CTF Monitor v2.0",   status: "Flagged" },
  { ts: "2025-07-25 16:42:11", user: "S. Torres",   action: "Document Upload",   entity: "Client", entityId: "CL-003",   model: "—",                  status: "Success" },
  { ts: "2025-07-25 15:30:08", user: "System",      action: "KYC Review Due",    entity: "Client", entityId: "CL-001",   model: "KYC Scheduler v1.4", status: "Triggered" },
  { ts: "2025-07-25 14:08:50", user: "J. Park",     action: "Alert Closed",      entity: "Alert",  entityId: "ALT-4817", model: "—",                  status: "Success" },
  { ts: "2025-07-25 13:22:30", user: "System",      action: "PEP Screen",        entity: "Client", entityId: "CL-002",   model: "PEP Detect v3.0",    status: "Match Found" },
  { ts: "2025-07-25 11:05:01", user: "Admin",       action: "Rule Threshold Upd",entity: "Rule",   entityId: "R-101",    model: "Rule Engine v3.2",   status: "Success" },
  { ts: "2025-07-24 17:44:13", user: "System",      action: "Batch Risk Recalc", entity: "Client", entityId: "ALL",      model: "Risk Scoring v2.8",  status: "Success" },
  { ts: "2025-07-24 16:20:00", user: "M. Chen",     action: "Logout",            entity: "User",   entityId: "USR-003",  model: "—",                  status: "Success" },
  { ts: "2025-07-24 09:00:00", user: "System",      action: "Daily Sanctions Sc",entity: "Client", entityId: "ALL",      model: "Sanctions v1.9",     status: "Success" },
];

// ── LOVs ─────────────────────────────────────────────────────────────────────
export const STATUS_LOV = [
  { value: "All",       label: "All Statuses" },
  { value: "Open",      label: "Open" },
  { value: "In Review", label: "In Review" },
  { value: "Escalated", label: "Escalated" },
  { value: "Closed",    label: "Closed" },
];
export const SEVERITY_LOV = [
  { value: "All",      label: "All Severities" },
  { value: "Critical", label: "Critical" },
  { value: "High",     label: "High" },
  { value: "Medium",   label: "Medium" },
  { value: "Low",      label: "Low" },
];
export const ALERT_CATEGORIES = ["All", "AML", "KYC", "Sanctions", "CTF", "EDD"];

export const CASE_STATUSES   = ["All", "Open", "In Review", "Escalated", "Closed"];
export const CASE_PRIORITIES = ["All", "Critical", "High", "Medium", "Low"];
export const CASE_TYPES      = ["All", "AML", "KYC", "SAR", "Sanctions", "CTF", "EDD"];

// Sequential IDs for anything created at runtime (new clients, users, etc.)
let clientSeq = clients.length;
export function nextClientId() {
  clientSeq += 1;
  return `CL-${String(clientSeq).padStart(3, "0")}`;
}