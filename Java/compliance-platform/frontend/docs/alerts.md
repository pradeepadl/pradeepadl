# Alerts

## Overview

Two screens: **Alerts** (`AlertsPage`), a filterable table of all alerts, and
**Alert Detail** (`AlertDetailPage`), a two-tab drill-in with a narrative
summary and the detection rules that fired. Both are unchanged by this
round of work — documented here because Cases now links into this same
alert data (see [cases.md](cases.md)) and it's the natural counterpart page.

## Files

| File | Responsibility |
|---|---|
| `../../backend/app/App.tsx` — `AlertsPage` | Filterable/searchable alert table. |
| `../../backend/app/App.tsx` — `AlertDetailPage` | Alert detail: summary + rules tabs. |
| `../../backend/app/data.ts` | `allAlerts`, `AlertItem` type, `STATUS_LOV`, `SEVERITY_LOV`, `ALERT_CATEGORIES`. |
| `../../backend/app/components/badges.tsx` | `SeverityBadge`, `AlertStatusBadge` (shared with Cases/Dashboard/Client Overview). |

`allAlerts` (in `data.ts`) is a **plain module-level constant**, not lifted
to `App()` state — unlike `clients`/`caseAlertLinks`. Nothing in the current
app mutates the alert list itself (status changes on the detail page are
local-only, see below), so there was no need to lift it.

## Routing

```tsx
// App.tsx
const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
function handleAlertSelect(id: string) { setSelectedAlertId(id); setActive("alert-detail"); }
function handleAlertBack()             { setSelectedAlertId(null); setActive("alerts"); }
...
case "alerts":       return <AlertsPage onAlertSelect={handleAlertSelect} />;
case "alert-detail":
  return selectedAlertId
    ? <AlertDetailPage alertId={selectedAlertId} onBack={handleAlertBack} />
    : <AlertsPage onAlertSelect={handleAlertSelect} />;
```

The "Alerts" top-nav tab stays visually active while on `alert-detail` too
(`isActive` check in the nav `.map` includes
`key === "alerts" && active === "alert-detail"`), and the breadcrumb bar
renders `Alerts > ALT-xxxx > <alert type>` with a working "Alerts" back-link.

## Alerts list (`AlertsPage`)

```tsx
function AlertsPage({ onAlertSelect }: { onAlertSelect: (id: string) => void })
```

- Local state: `search`, `severity`, `status`, `category` — all `"All"` by
  default.
- Summary cards: Open / In Review / Escalated / Critical counts, computed by
  filtering `allAlerts` inline on every render (not memoized — fine at this
  data volume).
- Filter row: free-text search (matches `id`, `client`, or `type`,
  case-insensitive) + three `<select>` dropdowns driven by `ALERT_CATEGORIES`,
  `SEVERITY_LOV`, `STATUS_LOV`. A "Clear filters" link appears once any
  non-"All" filter is active.
- Table columns: Alert ID (button → `onAlertSelect`), Client, Type,
  Category badge, `SeverityBadge`, `AlertStatusBadge`, Assignee, Date.

## Alert Detail (`AlertDetailPage`)

```tsx
function AlertDetailPage({ alertId, onBack }: { alertId: string; onBack: () => void })
```

- `alert = allAlerts.find(a => a.id === alertId)!` — non-null-asserted;
  only reachable via `onAlertSelect`, so always resolves in practice.
- `rules = alertRules[alertId] ?? defaultRules` — `alertRules` (module-level
  const in `App.tsx`) has hand-authored rule sets for 4 specific alert IDs
  (`ALT-4821`, `ALT-4820`, `ALT-4819`, `ALT-4818`); every other alert falls
  back to the generic 3-rule `defaultRules` set.
- Local `currentStatus` state, seeded from `alert.status` — **this is a
  display-only override**. Changing it via the dropdown or the "Update
  Status" button row updates what's shown on this page for the rest of the
  session, but never writes back into `allAlerts`. Navigating away and back
  resets it to the original seed value.
- Two tabs (local `detailTab` state):
  - **Alert Summary** — details grid, 3 risk-indicator progress bars
    (Overall Risk Score = average score of triggered rules, Rules Triggered
    count, a synthetic Confidence Level), a hand-authored analyst narrative
    per alert ID (falls back to a templated sentence built from
    `alert.client`/`alert.type`/`alert.category` for alerts without one),
    and the status-update button row.
  - **Detection / Rules Triggered** — 3 metric cards + a table of every rule
    in `rules`, each showing triggered/not-triggered, score bar, and
    confidence.

## Known limitations (not yet implemented)

- Status changes on the detail page are **not persisted** — local
  component state only, lost on navigating away or reloading.
- Only 4 alerts have bespoke detection-rule data and analyst narratives; all
  others use the generic fallbacks (`defaultRules`, templated narrative
  string).
- No create/edit/delete for alerts — they're a fixed seed list.
- Not wired to a backend; `allAlerts` is a static TypeScript array.