import { useState } from "react";
import { ChevronRight, Plus, Pencil, Trash2, Users as UsersIcon, ShieldCheck, FolderCog, Link2 } from "lucide-react";
import { Modal, ModalFooter, FormField, inputClass } from "../../components/Modal";

// ── Types & seed data ────────────────────────────────────────────────────────

type Role = { id: string; name: string; description: string; permissions: string[] };
type Group = { id: string; name: string; description: string; roleIds: string[] };
type UserAccount = {
  id: string; name: string; email: string; status: "Active" | "Inactive";
  roleIds: string[]; groupIds: string[]; lastLogin: string;
};

const ALL_PERMISSIONS = [
  "View Alerts", "Manage Alerts", "View Cases", "Manage Cases",
  "View Clients", "Manage Clients", "View Reports", "Manage Policies", "System Administration",
];

const initialRoles: Role[] = [
  { id: "ROL-01", name: "Compliance Analyst",   description: "Investigates alerts and manages case workflows.",       permissions: ["View Alerts", "Manage Alerts", "View Cases", "Manage Cases", "View Clients"] },
  { id: "ROL-02", name: "Compliance Manager",    description: "Oversees case escalations and policy exceptions.",      permissions: ["View Alerts", "Manage Alerts", "View Cases", "Manage Cases", "View Clients", "Manage Clients", "View Reports"] },
  { id: "ROL-03", name: "Auditor",               description: "Read-only access for regulatory review.",               permissions: ["View Alerts", "View Cases", "View Clients", "View Reports"] },
  { id: "ROL-04", name: "System Administrator",  description: "Full platform configuration access.",                   permissions: ["System Administration", "Manage Policies", "View Reports"] },
];

const initialGroups: Group[] = [
  { id: "GRP-01", name: "AML Investigations Team", description: "Front-line analysts triaging daily alerts.",       roleIds: ["ROL-01"] },
  { id: "GRP-02", name: "Compliance Leadership",   description: "Managers and auditors overseeing the program.",     roleIds: ["ROL-02", "ROL-03"] },
  { id: "GRP-03", name: "IT & Platform Admins",    description: "Owns platform configuration and integrations.",     roleIds: ["ROL-04"] },
];

const initialUsers: UserAccount[] = [
  { id: "USR-001", name: "J. Park",    email: "j.park@complianceiq.com",    status: "Active",   roleIds: [],         groupIds: ["GRP-01"],           lastLogin: "Jul 26, 2025 11:47" },
  { id: "USR-002", name: "S. Torres",  email: "s.torres@complianceiq.com",  status: "Active",   roleIds: ["ROL-03"], groupIds: ["GRP-01"],           lastLogin: "Jul 25, 2025 16:42" },
  { id: "USR-003", name: "M. Chen",    email: "m.chen@complianceiq.com",    status: "Active",   roleIds: [],         groupIds: ["GRP-02"],           lastLogin: "Jul 26, 2025 12:31" },
  { id: "USR-004", name: "Admin User", email: "admin@complianceiq.com",     status: "Active",   roleIds: [],         groupIds: ["GRP-03"],           lastLogin: "Jul 26, 2025 09:02" },
  { id: "USR-005", name: "K. Delgado", email: "k.delgado@complianceiq.com", status: "Inactive", roleIds: ["ROL-01"], groupIds: [],                    lastLogin: "Jun 30, 2025 08:15" },
];

let seq = 5;
const nextId = (prefix: string) => { seq += 1; return `${prefix}-${String(seq).padStart(2, "0")}`; };

// ── Page ─────────────────────────────────────────────────────────────────────

type Tab = "users" | "roles" | "groups" | "sso";

export function UserManagementPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState(initialRoles);
  const [groups, setGroups] = useState(initialGroups);

  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id;
  const effectiveRoleIds = (u: UserAccount) => Array.from(new Set([
    ...u.roleIds,
    ...u.groupIds.flatMap((gid) => groups.find((g) => g.id === gid)?.roleIds ?? []),
  ]));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm">
        <button onClick={onBack} className="text-blue-600 hover:underline font-medium">Administration</button>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-gray-900 font-semibold">User Management</span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>User Management</h2>
        <p className="text-sm text-gray-400 mt-0.5">Users, roles, groups, and directory sign-on configuration</p>
      </div>

      {/* Tab bar */}
      <div className="bg-white rounded-xl border border-gray-100 px-2">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: "users" as const,  label: "Users",           icon: UsersIcon,  count: users.length },
            { key: "roles" as const,  label: "Roles",            icon: ShieldCheck, count: roles.length },
            { key: "groups" as const, label: "Groups",           icon: FolderCog,  count: groups.length },
            { key: "sso" as const,    label: "SSO / Directory",  icon: Link2,      count: null },
          ].map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              <Icon size={14} />
              {label}
              {count !== null && <span className="text-[10px] font-bold text-gray-400">{count}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === "users" && (
        <UsersTab users={users} setUsers={setUsers} roles={roles} groups={groups} roleName={roleName} effectiveRoleIds={effectiveRoleIds} />
      )}
      {tab === "roles" && <RolesTab roles={roles} setRoles={setRoles} />}
      {tab === "groups" && <GroupsTab groups={groups} setGroups={setGroups} roles={roles} />}
      {tab === "sso" && <SsoTab roles={roles} />}
    </div>
  );
}

// ── Users tab ────────────────────────────────────────────────────────────────

function UsersTab({
  users, setUsers, roles, groups, roleName, effectiveRoleIds,
}: {
  users: UserAccount[]; setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  roles: Role[]; groups: Group[];
  roleName: (id: string) => string;
  effectiveRoleIds: (u: UserAccount) => string[];
}) {
  const [modalUser, setModalUser] = useState<UserAccount | "new" | null>(null);

  function save(u: UserAccount) {
    setUsers((prev) => prev.some((x) => x.id === u.id) ? prev.map((x) => x.id === u.id ? u : x) : [...prev, u]);
    setModalUser(null);
  }
  function remove(id: string) {
    if (confirm("Remove this user? This cannot be undone.")) setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setModalUser("new")} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {["User", "Email", "Status", "Direct Roles", "Groups", "Effective Roles", "Last Login", ""].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-blue-50/20 transition-colors align-top">
                <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">{u.name}</td>
                <td className="px-5 py-3.5 text-xs text-gray-500">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${u.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{u.status}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1 max-w-[160px]">
                    {u.roleIds.length === 0 ? <span className="text-xs text-gray-300">—</span> : u.roleIds.map((rid) => (
                      <span key={rid} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">{roleName(rid)}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1 max-w-[160px]">
                    {u.groupIds.length === 0 ? <span className="text-xs text-gray-300">—</span> : u.groupIds.map((gid) => (
                      <span key={gid} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">{groups.find((g) => g.id === gid)?.name ?? gid}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {effectiveRoleIds(u).length === 0 ? <span className="text-xs text-gray-300">—</span> : effectiveRoleIds(u).map((rid) => (
                      <span key={rid} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{roleName(rid)}</span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{u.lastLogin}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModalUser(u)} className="text-gray-300 hover:text-blue-600 transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => remove(u.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalUser && (
        <UserModal
          user={modalUser === "new" ? null : modalUser}
          roles={roles}
          groups={groups}
          onClose={() => setModalUser(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function UserModal({
  user, roles, groups, onClose, onSave,
}: {
  user: UserAccount | null; roles: Role[]; groups: Group[];
  onClose: () => void; onSave: (u: UserAccount) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [status, setStatus] = useState<UserAccount["status"]>(user?.status ?? "Active");
  const [roleIds, setRoleIds] = useState<string[]>(user?.roleIds ?? []);
  const [groupIds, setGroupIds] = useState<string[]>(user?.groupIds ?? []);
  const [error, setError] = useState("");

  const toggle = (arr: string[], set: (v: string[]) => void, id: string) =>
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  function handleSave() {
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    onSave({
      id: user?.id ?? nextId("USR"),
      name: name.trim(), email: email.trim(), status, roleIds, groupIds,
      lastLogin: user?.lastLogin ?? "Never",
    });
  }

  return (
    <Modal open onClose={onClose} title={user ? "Edit User" : "Add User"} width="max-w-lg">
      <div className="flex flex-col gap-4">
        {error && <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <FormField label="Full Name" required>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Email" required>
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
        <FormField label="Status">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as UserAccount["status"])}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </FormField>
        <FormField label="Direct Roles">
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button key={r.id} type="button" onClick={() => toggle(roleIds, setRoleIds, r.id)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${roleIds.includes(r.id) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}>
                {r.name}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Groups">
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <button key={g.id} type="button" onClick={() => toggle(groupIds, setGroupIds, g.id)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${groupIds.includes(g.id) ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-500 border-gray-200 hover:border-purple-300"}`}>
                {g.name}
              </button>
            ))}
          </div>
        </FormField>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Save User</button>
      </ModalFooter>
    </Modal>
  );
}

// ── Roles tab ────────────────────────────────────────────────────────────────

function RolesTab({ roles, setRoles }: { roles: Role[]; setRoles: React.Dispatch<React.SetStateAction<Role[]>> }) {
  const [modalRole, setModalRole] = useState<Role | "new" | null>(null);

  function save(r: Role) {
    setRoles((prev) => prev.some((x) => x.id === r.id) ? prev.map((x) => x.id === r.id ? r : x) : [...prev, r]);
    setModalRole(null);
  }
  function remove(id: string) {
    if (confirm("Delete this role? Users and groups referencing it will lose it.")) setRoles((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setModalRole("new")} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Add Role
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {roles.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{r.name}</span>
                <span className="font-mono text-[10px] text-gray-300">{r.id}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5 mb-2">{r.description}</div>
              <div className="flex flex-wrap gap-1.5">
                {r.permissions.map((p) => (
                  <span key={p} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{p}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setModalRole(r)} className="text-gray-300 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
              <button onClick={() => remove(r.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {modalRole && <RoleModal role={modalRole === "new" ? null : modalRole} onClose={() => setModalRole(null)} onSave={save} />}
    </div>
  );
}

function RoleModal({ role, onClose, onSave }: { role: Role | null; onClose: () => void; onSave: (r: Role) => void }) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);
  const [error, setError] = useState("");

  function toggle(p: string) {
    setPermissions((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  }

  function handleSave() {
    if (!name.trim()) { setError("Role name is required."); return; }
    onSave({ id: role?.id ?? nextId("ROL"), name: name.trim(), description: description.trim(), permissions });
  }

  return (
    <Modal open onClose={onClose} title={role ? "Edit Role" : "Add Role"} width="max-w-lg">
      <div className="flex flex-col gap-4">
        {error && <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <FormField label="Role Name" required>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Description">
          <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <FormField label="Permissions">
          <div className="flex flex-wrap gap-2">
            {ALL_PERMISSIONS.map((p) => (
              <button key={p} type="button" onClick={() => toggle(p)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${permissions.includes(p) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}>
                {p}
              </button>
            ))}
          </div>
        </FormField>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Save Role</button>
      </ModalFooter>
    </Modal>
  );
}

// ── Groups tab ───────────────────────────────────────────────────────────────

function GroupsTab({ groups, setGroups, roles }: { groups: Group[]; setGroups: React.Dispatch<React.SetStateAction<Group[]>>; roles: Role[] }) {
  const [modalGroup, setModalGroup] = useState<Group | "new" | null>(null);
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id;

  function save(g: Group) {
    setGroups((prev) => prev.some((x) => x.id === g.id) ? prev.map((x) => x.id === g.id ? g : x) : [...prev, g]);
    setModalGroup(null);
  }
  function remove(id: string) {
    if (confirm("Delete this group? Members will lose roles inherited from it.")) setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button onClick={() => setModalGroup("new")} className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={14} /> Add Group
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {groups.map((g) => (
          <div key={g.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900" style={{ fontFamily: "'Outfit', sans-serif" }}>{g.name}</span>
                <span className="font-mono text-[10px] text-gray-300">{g.id}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5 mb-2">{g.description}</div>
              <div className="flex flex-wrap gap-1.5">
                {g.roleIds.length === 0 ? <span className="text-xs text-gray-300">No roles assigned</span> : g.roleIds.map((rid) => (
                  <span key={rid} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{roleName(rid)}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setModalGroup(g)} className="text-gray-300 hover:text-blue-600 transition-colors"><Pencil size={15} /></button>
              <button onClick={() => remove(g.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
      </div>

      {modalGroup && <GroupModal group={modalGroup === "new" ? null : modalGroup} roles={roles} onClose={() => setModalGroup(null)} onSave={save} />}
    </div>
  );
}

function GroupModal({
  group, roles, onClose, onSave,
}: { group: Group | null; roles: Role[]; onClose: () => void; onSave: (g: Group) => void }) {
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [roleIds, setRoleIds] = useState<string[]>(group?.roleIds ?? []);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setRoleIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function handleSave() {
    if (!name.trim()) { setError("Group name is required."); return; }
    onSave({ id: group?.id ?? nextId("GRP"), name: name.trim(), description: description.trim(), roleIds });
  }

  return (
    <Modal open onClose={onClose} title={group ? "Edit Group" : "Add Group"} width="max-w-lg">
      <div className="flex flex-col gap-4">
        {error && <div className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <FormField label="Group Name" required>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Description">
          <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </FormField>
        <FormField label="Roles Granted to Members">
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button key={r.id} type="button" onClick={() => toggle(r.id)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${roleIds.includes(r.id) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}>
                {r.name}
              </button>
            ))}
          </div>
        </FormField>
      </div>
      <ModalFooter>
        <button onClick={onClose} className="text-sm font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
        <button onClick={handleSave} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">Save Group</button>
      </ModalFooter>
    </Modal>
  );
}

// ── SSO / Directory tab ──────────────────────────────────────────────────────

function SsoTab({ roles }: { roles: Role[] }) {
  const [provider, setProvider] = useState("Generic LDAP / Active Directory");
  const [enabled, setEnabled] = useState(false);
  const [directoryUrl, setDirectoryUrl] = useState("ldaps://ad.client-domain.com:636");
  const [baseDn, setBaseDn] = useState("DC=client-domain,DC=com");
  const [bindDn, setBindDn] = useState("");
  const [bindPassword, setBindPassword] = useState("");
  const [defaultRole, setDefaultRole] = useState(roles[0]?.id ?? "");
  const [autoProvision, setAutoProvision] = useState(true);
  const [syncSchedule, setSyncSchedule] = useState("Daily");
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "testing" | "ok">("idle");

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleTest() {
    setTestResult("testing");
    setTimeout(() => setTestResult("ok"), 900);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-700" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Single Sign-On / Directory Connection
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Connect the client's SSO or Active Directory so their users can sign in directly.</p>
        </div>
        <button
          onClick={() => setEnabled((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-blue-600" : "bg-gray-200"}`}
        >
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
        </button>
      </div>

      <div className={`flex flex-col gap-4 ${!enabled ? "opacity-40 pointer-events-none" : ""}`}>
        <FormField label="Provider">
          <select className={inputClass} value={provider} onChange={(e) => setProvider(e.target.value)}>
            {["Generic LDAP / Active Directory", "Azure AD / Entra ID", "Okta", "SAML 2.0"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Directory URL">
            <input className={inputClass} value={directoryUrl} onChange={(e) => setDirectoryUrl(e.target.value)} />
          </FormField>
          <FormField label="Base DN">
            <input className={inputClass} value={baseDn} onChange={(e) => setBaseDn(e.target.value)} />
          </FormField>
          <FormField label="Bind DN">
            <input className={inputClass} value={bindDn} onChange={(e) => setBindDn(e.target.value)} placeholder="CN=svc-compliance,OU=Service Accounts,DC=..." />
          </FormField>
          <FormField label="Bind Password">
            <input className={inputClass} type="password" value={bindPassword} onChange={(e) => setBindPassword(e.target.value)} />
          </FormField>
          <FormField label="Default Role for New SSO Users">
            <select className={inputClass} value={defaultRole} onChange={(e) => setDefaultRole(e.target.value)}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </FormField>
          <FormField label="Sync Schedule">
            <select className={inputClass} value={syncSchedule} onChange={(e) => setSyncSchedule(e.target.value)}>
              {["Hourly", "Daily", "Weekly", "Manual only"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </FormField>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input type="checkbox" checked={autoProvision} onChange={(e) => setAutoProvision(e.target.checked)} className="rounded border-gray-300 accent-blue-600" />
          Auto-provision new users on first sign-in
        </label>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <button onClick={handleSave} disabled={!enabled} className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Save Configuration
        </button>
        <button onClick={handleTest} disabled={!enabled} className="text-sm font-medium text-gray-600 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {testResult === "testing" ? "Testing…" : "Test Connection"}
        </button>
        {saved && <span className="text-xs text-green-600 font-semibold">Configuration saved</span>}
        {testResult === "ok" && <span className="text-xs text-green-600 font-semibold">Connection successful</span>}
      </div>
    </div>
  );
}