# Client List / Client Overview

## Overview

Two related screens: **Client List** (`ClientListPage`), a searchable table of
monitored entities with a "Add Client" flow, and **Client Overview**
(`ClientOverviewPage`), the 7-tab detail page you land on after selecting a
client. Both live in `App.tsx`; the create-client modal is its own file.

## Files

| File | Responsibility |
|---|---|
| `../../backend/app/App.tsx` — `ClientListPage` | Table, search, "Add Client" trigger. |
| `../../backend/app/App.tsx` — `ClientOverviewPage` | 7-tab client detail page. |
| `../../backend/app/components/CreateClientModal.tsx` | The "Add Client" modal form. |
| `../../backend/app/data.ts` | `clients` (seed list), `clientDetails` (seed detail records), `Client`/`ClientDetail` types, `nextClientId()`. |

## State ownership

`clients` and `clientDetails` are **not** module-level constants read
directly by the pages (unlike, say, `allAlerts`/`allCases`) — they're lifted
to `App()` as `useState`, seeded from `data.ts`'s exports, and threaded down
as props. This is what makes "Add Client" actually show up in the list and
be selectable, rather than only existing for the current render:

```tsx
// App.tsx
const [clients, setClients]             = useState<Client[]>(initialClients);
const [clientDetails, setClientDetails] = useState<Record<string, ClientDetail>>(initialClientDetails);
```

```tsx
case "clients":
  return <ClientListPage clients={clients} onClientSelect={handleClientSelect} onCreateClient={handleCreateClient} />;
case "client-overview":
  return selectedClientId
    ? <ClientOverviewPage clientId={selectedClientId} clients={clients} clientDetails={clientDetails} onBack={handleClientBack} />
    : <ClientListPage clients={clients} onClientSelect={handleClientSelect} onCreateClient={handleCreateClient} />;
```

## Client List (`ClientListPage`)

```tsx
function ClientListPage({
  clients, onClientSelect, onCreateClient,
}: { clients: Client[]; onClientSelect: (id: string) => void; onCreateClient: (payload: NewClientPayload) => void })
```

- Local `search` state filters `clients` client-side on `name` or
  `industry` (case-insensitive substring match).
- Local `createOpen` boolean controls the `CreateClientModal`; owned by this
  component, not lifted further up — only the *result* of a successful
  create (`onCreateClient`) is passed up to `App()`.
- Table columns: Client ID (button → `onClientSelect`), Name, Industry, Open
  Alerts (`c.alerts`, color-coded: red if >10, orange if >0, gray if 0),
  Status badge, Risk badge (`RiskBadge`), overflow menu (visual only).
- "+ Add Client" button opens the modal; `onCreate` from the modal calls
  `onCreateClient(payload)` then closes the modal.

## Add Client flow (`CreateClientModal`)

```tsx
export function CreateClientModal({
  open, onClose, onCreate,
}: { open: boolean; onClose: () => void; onCreate: (payload: NewClientPayload) => void })

export type NewClientPayload = { client: Client; detail: ClientDetail };
```

Form sections: **Identification** (Legal Name*, Industry, Registration No.,
Tax ID/EIN), **Address** (street/city/region/postal/country — country input
also writes to `jurisdiction`), **Primary Contact** (Contact Name*, Email*,
Phone, Account Manager), **Risk Parameters** (Low/Medium/High selector).
`*` = required; validated inline (`setError(...)`) before submit, no
per-field errors.

On submit, the modal does **not** assign a real client ID — it emits
`id: ""` in the `client` object and lets the caller finalize it:

```tsx
// App.tsx
function handleCreateClient(payload: NewClientPayload) {
  const id = nextClientId();                                   // data.ts: sequential CL-00N
  const client: Client = { ...payload.client, id };
  setClients((prev) => [...prev, client]);
  setClientDetails((prev) => ({ ...prev, [id]: payload.detail }));
  handleClientSelect(id);                                       // navigates straight to the new client's overview
}
```

`nextClientId()` (in `data.ts`) is a module-level closure over a `clientSeq`
counter seeded from `clients.length` — it does not inspect the current
`clients` state, so IDs are sequential per session but not guaranteed
collision-free against IDs from a hypothetical future backend.

Risk rating maps to a synthetic starting `riskScore` for the new client:
High → 78, Medium → 45, Low → 15 (`clientDetails.ts` construction in the
modal). `lastReview`/`onboarded` are set to today's date (`toLocaleDateString`);
`nextReview` is `"—"`; `alerts`/`cases` start empty; `activity` seeds one
entry: `"Client onboarded"` by `"Admin User"`.

## Client Overview (`ClientOverviewPage`)

```tsx
function ClientOverviewPage({
  clientId, clients, clientDetails, onBack,
}: { clientId: string; clients: Client[]; clientDetails: Record<string, ClientDetail>; onBack: () => void })
```

Looks up `client = clients.find(c => c.id === clientId)!` and
`details = clientDetails[clientId]` — both non-null-asserted, so navigating
to a `clientId` that doesn't exist in either map will throw at render. In
practice this can't happen through the UI (IDs only ever come from
`ClientListPage`'s own `clients` prop or from `handleCreateClient`, which
always populates both maps together).

Header card: name, Active/Watch status badge, `RiskBadge`, ID/industry/
jurisdiction/onboarded line, "Edit Client" button (visual only, no handler),
and a 7-tab bar (`CLIENT_TABS`, local `tab` state):

| Tab key | Label | Content |
|---|---|---|
| `overview` | Client Overview | 4 metric cards (Open Alerts, Active Cases, Total Cases, Risk Score), Account Summary grid, radial Risk Score gauge (inline SVG), Recent Activity timeline (`details.activity`). |
| `profile` | Client Profile | Identification grid, Contact Information grid, Compliance Status grid. |
| `cases` | Cases (`details.cases.length`) | Table of `details.cases`. |
| `alerts` | Alerts (`details.alerts.length`) | Table of `details.alerts`. |
| `attributes` | Attributes | 4 static cards: Business, Regulatory, KYC, Product & Service attributes — entirely hardcoded display text, not derived from `details`. |
| `documents` | Documents | Static table of 6 hardcoded documents (not per-client — every client shows the same rows) + non-functional "+ Upload" button. |
| `related-entities` | Related Entities | Static table of 5 hardcoded related entities (also not per-client) + non-functional "+ Link Entity" button. |

The `details.cases`/`details.alerts` shown on the `cases`/`alerts` tabs come
straight from the seed data's per-client filter in `data.ts`
(`allCases.filter(c => c.client === "...")` etc.) — for a client created via
the modal these arrays are empty (`[]`), so those tabs correctly show "No
cases/alerts for this client."

## Known limitations (not yet implemented)

- **Attributes, Documents, and Related Entities tabs are entirely static** —
  identical content is shown for every client, including newly created ones.
  They are not wired to `clientDetails` or any create-client input.
- "Edit Client", "+ Upload" (Documents), and "+ Link Entity" (Related
  Entities) buttons have no handlers.
- No client edit or delete flow — clients can only be added, never modified
  or removed, from the UI.
- `nextClientId()`'s counter lives in module scope and resets on full page
  reload (back to `clients.length` from the seed data), so IDs can repeat
  across sessions.
- Everything is in-memory `useState` — no backend persistence; a page reload
  reverts to the seeded six clients.