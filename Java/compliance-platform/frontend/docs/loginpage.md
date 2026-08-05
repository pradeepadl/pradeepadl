# Login Page

## Overview

The app's entry gate. Renders full-screen in place of the main shell until
the user signs in; once signed in, the standard header/nav/page layout takes
over and stays mounted until logout. There is no real authentication behind
it — this is a client-side gate over the mock-data app, matching the rest of
the platform's current mock/demo status (see [Known Limitations](#known-limitations-not-yet-implemented)).

## File

| File | Responsibility |
|---|---|
| `src/app/pages/LoginPage.tsx` | The entire login screen — form, validation, theming. |
| `src/app/App.tsx` (`App()`) | Owns the `isAuthenticated` gate and renders `LoginPage` when signed out. |

## Component

```tsx
export function LoginPage({ onLogin }: { onLogin: (username: string) => void }) { ... }
```

Single component, no children. Local `useState` for `username`, `password`,
`remember` (checkbox, cosmetic only — not persisted), and `error`.

## Where it plugs into the app shell

`App()` in `App.tsx` holds the actual auth state:

```tsx
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [currentUser, setCurrentUser]         = useState("");

function handleLogin(username: string) { setCurrentUser(username); setIsAuthenticated(true); }
function handleLogout() {
  setIsAuthenticated(false); setCurrentUser("");
  setActive("dashboard"); setSelectedClientId(null); setSelectedAlertId(null); setSelectedCaseId(null); setAdminSection(null);
}
...
if (!isAuthenticated) {
  return <LoginPage onLogin={handleLogin} />;
}
```

`isAuthenticated` is plain in-memory React state — it resets on every full
page reload (F5), there is no `localStorage`/cookie/session persistence
despite the "Keep me signed in" checkbox being present in the form.

`handleLogout` also resets every navigation `useState` (`active`,
`selectedClientId`, `selectedAlertId`, `selectedCaseId`, `adminSection`) so a
fresh login always lands back on the Dashboard with a clean slate, rather
than re-showing whatever detail page was open when the user signed out.

## Header wiring

Once authenticated, the top-right avatar in the app header derives from
`currentUser`:

- Avatar initial: `(currentUser.trim()[0] ?? "U").toUpperCase()`
- Display name: `currentUser || "User"`
- The header's `LogOut` icon button calls `handleLogout` directly.

## Validation / submit flow

```tsx
function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!username.trim() || !password.trim()) {
    setError("Enter both username and password.");
    return;
  }
  setError("");
  onLogin(username.trim());
}
```

- Both fields just need to be non-empty — **no credential check happens
  anywhere**. Any username/password combination signs in successfully.
- On success, the typed username (trimmed) becomes `currentUser` verbatim —
  there's no user directory lookup, so it will not match anything in
  Administration → User Management's seeded accounts unless typed to match.
- Password is a real `type="password"` input but is never read after the
  `handleSubmit` check — it isn't sent anywhere or stored.

## Layout / theming

Matches the platform's existing dark-navy/blue design system:

- Full-viewport `radial-gradient` background (`#16213e` → `#0d1526` →
  `#0a0f1c`), same navy family as the app header (`#0d1526`).
- Centered logo block: blue-600 rounded square with the `Shield` icon (same
  mark used in the header) + "ComplianceIQ" wordmark in `Outfit` + "Risk &
  Monitoring Platform" subtitle.
- White card (`rounded-xl`, `shadow-2xl`) centered below the logo, `max-w-sm`,
  containing the form: heading, inline error banner (conditional), Username
  field (`User` icon), Password field (`Lock` icon) with a "Forgot
  password?" link, "Keep me signed in" checkbox, blue-600 "Sign In" submit
  button, and a non-functional "sign in with SSO" link.
- Footer copyright line in low-opacity white.

## Known limitations (not yet implemented)

- No real authentication — any non-empty credentials succeed.
- "Forgot password?" and "sign in with SSO" are inert (no `onClick`/`href`).
- "Keep me signed in" doesn't persist the session; a page reload always
  returns to the login screen.
- Not integrated with Administration → User Management's user list — logging
  in as "j.park" does not associate the session with the `USR-001` record
  seeded there.