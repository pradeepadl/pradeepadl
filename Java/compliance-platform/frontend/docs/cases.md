# Cases

## Overview

Three pieces: **Cases** (`CasesPage`), a filterable table of every case;
**Case Detail** (`CaseDetailPage`), a new page reached by clicking a Case ID,
showing case info plus the alerts linked to it for investigation; and an
**Attach Alerts** picker (`AttachAlertsModal`, private to the detail page)
for linking more alerts to a case.

## Files

| File | Responsibility |
|---|---|
| `src/app/App.tsx` — `CasesPage` | Filterable/searchable case table; Case ID / title are now clickable. |
| `src/app/pages/CaseDetailPage.tsx` | Case detail page + the alert-attach modal. |
| `src/app/data.ts` | `allCases`, `CaseRecord` type, `initialCaseAlertLinks` (seed case↔alert links), `CASE_STATUSES`/`CASE_PRIORITIES`/`CASE_TYPES`. |
| `src/app/components/badges.tsx` | `CasePriorityBadge`, `CaseStatusBadge` (also used by Client Overview's Cases tab). |
| `src/app/components/Modal.tsx` | Shared `Modal`/`ModalFooter` wrapper used by the attach-alerts picker. |

## The case ↔ alert link, and why it needed new state

`allCases` (seed data) already had a numeric `alerts` count field per case
(e.g. `{ id: "CSE-0291", ..., alerts: 4 }`), but that was always just a
static number — there was no actual list of *which* alerts. To make
"multiple alerts can attach to the same case for investigation" real, a
separate mapping was added and lifted to `App()` state:

```ts
// data.ts
export const initialCaseAlertLinks: Record<string, string[]> = {
  "CSE-0291": ["ALT-4821", "ALT-4815"],
  "CSE-0290": ["ALT-4820", "ALT-4814"],
  ...
};
```

```tsx
// App.tsx
const [caseAlertLinks, setCaseAlertLinks] = useState<Record<string, string[]>>(initialCaseAlertLinks);

function handleAttachAlerts(caseId: string, alertIds: string[]) {
  setCaseAlertLinks((prev) => ({
    ...prev,
    [caseId]: Array.from(new Set([...(prev[caseId] ?? []), ...alertIds])),
  }));
}
function handleRemoveAlertFromCase(caseId: string, alertId: string) {
  setCaseAlertLinks((prev) => ({ ...prev, [caseId]: (prev[caseId] ?? []).filter((id) => id !== alertId) }));
}
```

`allCases` itself stays a static, unmutated array — only the linkage map is
stateful. The Cases table's "Alerts" column now prefers the live link count
over the static seed number: `caseAlertLinks[c.id]?.length ?? c.alerts`.

> The seed links in `initialCaseAlertLinks` are demo data picked to roughly
> match each case's original `alerts` count and, where plausible, share the
> case's client — they don't reconcile exactly and shouldn't be read as a
> real historical record.

## Routing

```tsx
// App.tsx
const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
function handleCaseSelect(id: string) { setSelectedCaseId(id); setActive("case-detail"); }
function handleCaseBack()             { setSelectedCaseId(null); setActive("cases"); }
...
case "cases":
  return <CasesPage caseAlertLinks={caseAlertLinks} onCaseSelect={handleCaseSelect} />;
case "case-detail":
  return selectedCaseId
    ? <CaseDetailPage caseId={selectedCaseId} attachedAlertIds={caseAlertLinks[selectedCaseId] ?? []}
        onAttachAlerts={handleAttachAlerts} onRemoveAlert={handleRemoveAlertFromCase} onBack={handleCaseBack} />
    : <CasesPage caseAlertLinks={caseAlertLinks} onCaseSelect={handleCaseSelect} />;
```

Same pattern as Alerts/Clients: the "Cases" nav tab stays active on
`case-detail` (`isActive` includes `key === "cases" && active === "case-detail"`),
and the breadcrumb bar shows `Cases > CSE-xxxx > <case title>` with a working
back-link.

## Cases list (`CasesPage`)

```tsx
function CasesPage({
  caseAlertLinks, onCaseSelect,
}: { caseAlertLinks: Record<string, string[]>; onCaseSelect: (id: string) => void })
```

- Local state: `search`, `caseStatus`, `priority`, `caseType` filters (chip
  buttons, not dropdowns — driven by `CASE_STATUSES`/`CASE_PRIORITIES`/`CASE_TYPES`).
- Summary cards: Open / In Review / Escalated / Closed counts.
- Table: **Case ID and Title are both clickable** (`onCaseSelect(c.id)`,
  styled as blue links), plus Client, Type badge, `CasePriorityBadge`,
  `CaseStatusBadge`, Assignee, Opened, Due Date (turns red+bold if overdue
  and not Closed), and the Alerts count (now `caseAlertLinks[c.id]?.length
  ?? c.alerts`, colored red >3 / orange >0 / gray 0). The row's overflow
  (`⋯`) button also opens the case detail page.

## Case Detail (`CaseDetailPage`)

```tsx
export function CaseDetailPage({
  caseId, attachedAlertIds, onAttachAlerts, onRemoveAlert, onBack,
}: {
  caseId: string;
  attachedAlertIds: string[];
  onAttachAlerts: (caseId: string, alertIds: string[]) => void;
  onRemoveAlert: (caseId: string, alertId: string) => void;
  onBack: () => void;
})
```

- `caseItem = allCases.find(c => c.id === caseId)!` — resolves the static
  case fields (title, client, type, priority, assignee, opened/due dates).
- Local `currentStatus` state seeded from `caseItem.status` — same
  display-only pattern as `AlertDetailPage`'s status dropdown: editable in
  the UI, **not persisted** back into `allCases`, resets on revisit.
- `attachedAlerts = allAlerts.filter(a => attachedAlertIds.includes(a.id))`
  — resolves the linked IDs (passed down from `App()`'s `caseAlertLinks`)
  into full alert records for display.
- Sections: breadcrumb, header card (title, priority/status badges, status
  dropdown), a details grid + an "Investigation Summary" panel (a
  templated sentence: alert count + distinct rule-category count, or a
  placeholder when nothing's attached), and the **Linked Alerts** table
  (Alert ID, Type, Client, Category, `SeverityBadge`, `AlertStatusBadge`,
  Date, and a trash-can button calling `onRemoveAlert`).
- "Attach Alerts" button opens `AttachAlertsModal` (local `attachOpen` state).

### Attach Alerts modal

```tsx
function AttachAlertsModal({
  open, onClose, excludeIds, preferredClient, onAttach,
}: { open: boolean; onClose: () => void; excludeIds: string[]; preferredClient: string; onAttach: (ids: string[]) => void })
```

- Candidates = `allAlerts` minus `excludeIds` (already-attached alerts),
  filtered by the modal's own `search` text (matches ID, type, or client),
  then sorted so alerts from `preferredClient` (the case's own client) sort
  first — but alerts from *any* client can still be selected and attached.
- Checkbox multi-select (`selected` local state); "Attach (N)" button is
  disabled until at least one is checked. On confirm, calls
  `onAttach(selected)` — the case-detail page then calls
  `onAttachAlerts(caseItem.id, ids)` and closes the modal.

## Known limitations (not yet implemented)

- Status changes on the detail page are display-only, not persisted.
- No create/edit/delete for cases themselves — only the alert linkage is
  mutable.
- Attaching an alert from a different client than the case is allowed by
  the picker (only sorted to the bottom, not filtered out) — there's no
  guardrail against linking unrelated alerts.
- `caseAlertLinks` state lives only in `App()`; a page reload reverts every
  case to its `initialCaseAlertLinks` seed.
- No investigation notes / free-text field beyond the auto-generated
  Investigation Summary sentence.