# Frontend — Architecture Guide

React + TypeScript via Vite, with TanStack Query owning server state. Read the root
`CLAUDE.md` first for repo-wide rules. This file covers **frontend structure, separation of
concerns, React conventions, UI rules, and testing**.

Guiding rule: **components render; hooks and pure functions hold logic.** A component file
should read like a template — destructure from a hook, map to JSX. Anything that isn't "turn
this data into markup" (fetching, mutations, computation, branching rules) lives outside the
component.

---

## Structure

```
src/
  api/                 // client.ts (base fetch) + entriesApi, gamesApi, pricesApi
  hooks/
    queries/           // TanStack Query reads: useGameSearch, usePlayedEntries...
    mutations/         // writes + cache invalidation: useAddEntry, useReorderEntries...
    logic/             // derived state + handlers: useDebouncedValue, useWishlistTotal...
  components/          // presentational ONLY (props in, JSX out, callbacks out)
  features/            // a view = composition of components + hooks (little/no logic)
    add-game/AddGameModal.tsx
    played/  backlog/  wishlist/   (added per milestone)
  app/                 // App.tsx, QueryClientProvider, tab navigation
  types/               // UI-facing types (re-exported from shared/)
  test/                // setup.ts (jest-dom matchers)
```

### Planned: `stores/` (client state)
We do **not** have a client-state store yet, and **server state must never go in one** — that
is TanStack Query's job. When we need shared *client* UI state that outgrows local `useState`
and prop-passing (e.g. active tab, open modal, theme), add a `hooks/stores/` (or `stores/`)
folder for it (Zustand or Context). Until then, keep ephemeral UI state local. Do not
pre-build this folder.

---

## Separation of concerns (responsibilities by layer)

- **`components/` — presentational only.** Receive props, return JSX, emit callbacks
  (`onSelect`, `onReorder`). **No** data fetching, **no** API calls, **no** business logic.
  The only local state allowed is ephemeral pure-UI state ("is dropdown open", "input text").
  Display formatting is fine; computation is not. Props must be `readonly` (lint-enforced via
  `Readonly<Props>`).
- **`hooks/` — all logic lives here**, split by purpose:
  - **`queries/`** wrap TanStack Query reads.
  - **`mutations/`** wrap writes + cache invalidation.
  - **`logic/`** hold derived state, debouncing, event handling — memoised where it matters.
- **`api/` — the only place that knows URLs and response shapes.** One typed function per
  backend endpoint, built on `client.ts`. Hooks call these; **components never import `api/`**
  (lint-enforced).
- **`features/` — composition.** A view wires presentational components to hooks. It should
  contain little or no logic itself.
- **`app/App.tsx` stays composition-only.** Do not let it accumulate fetching or branching
  logic — push that into hooks/features as the app grows.

### Data flow (a component never reaches past the first hop)
```
Component → Hook (query/mutation/logic) → api/ wrapper → /api/*   (cached by TanStack Query)
                                         → shared/ domain logic (pure)
```

---

## React rules

- **Server state → TanStack Query only.** Never copy it into `useState` (causes stale-data
  bugs). `useState` is for ephemeral UI state.
- **Derived values are computed in hooks** (memoised), not recomputed inline in JSX.
- **If a component contains fetching, a mutation, or non-trivial computation → extract it**
  into a hook (logic) or `shared/` (pure function).
- **No `fetch`/`axios` in components or views** — only via `api/`, reached through hooks.
- **Shared rules come from `shared/`** (e.g. `preferredPlatform` inside `PlatformBadge`),
  never re-implemented in a component.
- **Single source of truth for UI.** Common presentational primitives live once in
  `components/` and are reused by every view — `Button` (bakes in `type="button"`), `Loading`,
  `ErrorBanner` (all alerts go through it), `GameCard`, `PlatformBadge`. Don't hand-write a raw
  `<button>` or a `<p>Loading…</p>` / `<p role="alert">` in a view; use the primitive. Repeated
  markup is a duplication defect — extract it into `components/`.
- Keep components small, one concern each. List rows stay presentational; interaction logic
  (e.g. `@dnd-kit` reordering) lives in the list container + a mutation hook.
- Hook keys: TanStack Query keys are arrays, hierarchical and stable
  (`['games', 'search', query]`). Mutations invalidate the matching read keys.

---

## TypeScript (frontend specifics)

- Same strictness as the repo (no `any`). `tsconfig` here uses `moduleResolution: Bundler`,
  `jsx: react-jsx`, and `allowImportingTsExtensions` — **import local modules with their
  `.ts`/`.tsx` extension** (e.g. `'./client.ts'`), matching existing files.
- Component signatures: `export function X(props: Readonly<XProps>): JSX.Element` (import
  `JSX` from `react`). Hooks declare their return type (e.g. `UseQueryResult<T>`).
- UI-facing types re-export from `shared/` via `types/` — do not redeclare `Entry`/`Game`.

---

## UI rules

Responsive web only (no native app); desktop-first is fine, must not break on mobile widths.

**Theme: dark, "game library" feel.** Define colours as CSS custom properties (design tokens)
in one place and reference the variables — never hard-code hex values in components. Proposed
token set (adjust centrally, not per-component):

```css
:root {
  /* surfaces */
  --bg:            #0F1115;  /* app background */
  --surface:       #1A1D24;  /* cards, panels */
  --surface-raised:#232730;  /* hover / elevated */
  --border:        #2C313B;

  /* text */
  --text:          #E6E8EB;
  --text-muted:    #9AA0AA;

  /* brand / accent */
  --accent:        #7C5CFF;  /* primary actions, focus ring */
  --accent-hover:  #6B4CF0;

  /* platform badges */
  --pc:            #246ec2;  /* PC */
  --ps5:           #0070D1;  /* PlayStation blue */

  /* status */
  --sale:          #38C172;  /* discount / good price */
  --danger:        #E5484D;  /* destructive, errors */
  --warning:       #F5A623;
}
```

- **Platform badge colours** come from these tokens; the PC-vs-PS5 choice itself comes from
  `preferredPlatform` (never decide platform in CSS).
- **Sale styling:** show `discountPct` with a "🔥 on sale" badge and strike-through
  `normalPrice` only when a discount is present.
- Keep styling out of logic. Components may carry className/`data-*` hooks (e.g.
  `data-platform`) for styling; they must not branch on business rules to compute styles.
- Accessibility: label inputs (`aria-label`), use real `<button>`s for actions, provide
  `alt` on cover images, and `role="alert"` for error text.

> Styling mechanism (plain CSS vs CSS Modules vs a lib) is not locked yet. Whatever we pick,
> the token variables above stay the single source of colour truth.

---

## Testing guidelines (frontend)

Vitest + React Testing Library (jsdom). `src/test/setup.ts` loads jest-dom matchers.

- **Presentational components** — render with props, assert output. Because they're logic-free
  these stay simple/stable. e.g. `PlatformBadge` shows PC/PS5/N/A; a `SaleBadge` shows the
  discount only when set.
- **Hooks + interaction** — render a feature/view, **fake the `api/` layer at its boundary**,
  simulate user actions with `@testing-library/user-event`, assert what the user sees and which
  calls fire. e.g. AddGameModal: type → results render → click → `onSelect` fires.
- **Faking the api:** `vi.mock('../../api/xxxApi.ts', ...)`. `vi.mock` is hoisted — put any
  fixture it references inside `vi.hoisted(...)` (see `AddGameModal.test.tsx`). MSW is the
  planned upgrade for network-level mocking when flows get more complex.
- **Test behaviour, not implementation.** No real network. Wrap hooks-under-test in a
  `QueryClientProvider` built from `createQueryClient()`.
- Co-locate as `*.test.tsx`; one behaviour per test; AAA; descriptive names.

---

## Packages (frontend) — what and why

| Package | Why / how to use |
|---------|------------------|
| `react`, `react-dom` | UI library. Function components + hooks only. |
| `@tanstack/react-query` | **Single source of truth for server state** — all reads/writes/caching/invalidation. Configured in `app/queryClient.ts`, provided in `main.tsx`. Never duplicate server data into `useState`. |
| `vite`, `@vitejs/plugin-react` | Dev server + build. Dev server proxies `/api` → backend (`BACKEND_URL` or localhost). Pinned to Vite 5 to match Vitest 2's bundled Vite. |
| `vitest` | Test runner. `vite.config.ts` holds the `test` block (import `defineConfig` from `vitest/config`). |
| `@testing-library/react` | Render + query components by accessible roles/labels. |
| `@testing-library/user-event` | Simulate real user interaction (preferred over `fireEvent`). |
| `@testing-library/jest-dom` | DOM matchers (`toHaveTextContent`, `toHaveAttribute`). |
| `jsdom` | Browser-like environment for component tests. |
| `@types/react`, `@types/react-dom` | Type definitions. |

Planned (per spec, install when the milestone lands): `@dnd-kit/core` + `@dnd-kit/sortable`
(drag-to-reorder the Played list, inside the list container only), and **MSW** for
network-level test mocking.

**New frontend package → add a row here** stating what it is and how it should be used.
