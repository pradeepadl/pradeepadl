# Frontend implementation docs

Implementation notes for the screens built/extended in this round of work.
Each doc covers: which files own the feature, exact prop/type signatures,
how state is threaded through `App.tsx`, the user-facing flow, and — since
this is still a mock-data app — an explicit "known limitations" section
noting what's local-state-only vs. what would need real backend wiring.

| Doc | Covers |
|---|---|
| [loginpage.md](loginpage.md) | Login screen, the `isAuthenticated` gate in `App()`, header avatar/logout wiring. |
| [clientlist.md](clientlist.md) | Client List table, Add Client modal, Client Overview's 7 tabs. |
| [alerts.md](alerts.md) | Alerts list + Alert Detail (summary/rules tabs). |
| [cases.md](cases.md) | Cases list + new Case Detail page, and the case↔alert attach-for-investigation flow. |
| [administration.md](administration.md) | Admin hub + all 6 sections (User Management, Alert Rules, Compliance Policies, Audit Log, Risk Models, Integrations). |

## Shared building blocks referenced across these docs

- `../../backend/app/data.ts` — mock data, derived types (`Client`, `AlertItem`,
  `CaseRecord`, `ClientDetail`), and shared LOVs. Most of it is plain
  module-level constants; `clients`, `clientDetails`, and the case↔alert
  linkage are the exceptions — those get lifted into `App()` `useState` so
  they're actually mutable at runtime (see clientlist.md / cases.md).
- `../../backend/app/components/badges.tsx` — `SeverityBadge`, `RiskBadge`,
  `AlertStatusBadge`, `CasePriorityBadge`, `CaseStatusBadge`.
- `../../backend/app/components/Modal.tsx` — `Modal`, `ModalFooter`, `FormField`,
  `inputClass`, reused by every create/edit form (Create Client, all of
  User Management's CRUD, Compliance Policies, Integrations, Attach Alerts).

## What's real vs. mock, at a glance

Nothing in the frontend talks to the Spring Boot backend yet (see the
repo-root `docker-compose.deploy.yml` / backend docs for that side). Within
the frontend itself:

- **Persisted for the session** (React `useState` in `App()`, survives
  navigating between pages, lost on reload): clients, case↔alert links,
  which client/case/alert/admin-section is selected, login state.
- **Local to a single page, lost on navigating away** (`useState` inside
  the page component itself): alert/case status-dropdown edits, all of
  User Management / Compliance Policies / Integrations' CRUD.
- **Fully static**: `allAlerts`, `allCases` (the records themselves, not
  the case↔alert links), Client Overview's Attributes/Documents/Related
  Entities tabs, Alert Rules, Risk Models, Audit Log.