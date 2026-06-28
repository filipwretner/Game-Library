# Code Review Guide — Game Tracker

How to review changes in this repo. Read this in full before reviewing, then go through the
diff with these checks in mind. Report findings grouped by severity; cite `file:line`. Praise
nothing — only surface problems and concrete fixes. The authoritative rules live in the three
`CLAUDE.md` files (root, `backend/`, `frontend/`); this guide is the review lens over them.

Order of priority: **1) architecture boundaries → 2) correctness → 3) performance → 4) code
quality → 5) tests.** A boundary break or an N+1 is worse than a naming nit.

---

## 1. Architectural boundaries (highest priority)

Dependencies point inward only; the linter enforces most of this, but review catches what it
can't (logic placed in the wrong layer even when imports are legal).

**Backend (layers, outer → inner: http → services → domain → repositories → integrations):**
- **Controllers stay thin** — validate (Zod) → call one service method → respond. Flag any
  business logic, branching, DB access, or `fetch` in a controller.
- **Prisma only in `repositories/prisma/`.** Flag `@prisma/client` or `PrismaClient` imported
  anywhere else (services, domain, http).
- **Services depend on ports, not concretes.** Flag a service importing a Prisma repo impl or a
  concrete provider (IGDB/CheapShark client) instead of the interface.
- **`domain/` is pure.** No I/O, no Prisma/Express/React, no `Date.now()`-driven branching that
  belongs in a service. Business rules belong here (and in `shared/`), defined once.
- **External APIs only behind ports** (`MetadataProvider`, `PriceProvider`). Flag a service
  calling IGDB/CheapShark directly.
- **Errors:** services/domain throw typed `DomainError`s; mapping happens once in
  `errorHandler`. Flag per-route `try/catch`, ad-hoc `res.status(...)` for errors, or swallowed
  errors. Async controllers must be wrapped in `asyncHandler`.

**Frontend (components render; hooks/pure-fns hold logic):**
- **Components are presentational.** Flag fetching, mutations, `fetch`/`axios`, or non-trivial
  computation in a component. Only ephemeral UI state (`useState` for input/toggles) is allowed.
- **No `api/` imports from `components/`** — must go through hooks (lint-enforced; also check
  for logic that *should* be a hook but was inlined in a view).
- **Server state lives in TanStack Query only.** Flag server data copied into `useState`, or
  derived values recomputed inline in JSX instead of memoised in a hook.
- **Shared rules come from `shared/`** (e.g. `preferredPlatform`). Flag any re-implementation.
- **`app/App.tsx` and `features/*` stay composition-only.** Flag accumulating logic there.

**Cross-stack:** types/contracts come from `shared/` and are defined once. Flag a duplicated
`Entry`/`Game`/`*Result` shape or a re-declared union.

---

## 2. Correctness

- Status-transition side-effects: moving an entry must clear the old list's fields
  (`resetFieldsForStatus`) and assign/clear `rank`. Verify price fields clear on move to
  PLAYED/BACKLOG, rank clears off PLAYED, etc.
- Validation at the boundary covers the real input (Zod schema matches the body/params/query).
  Inner layers must not re-validate or, worse, trust unvalidated input.
- One-list-per-game invariant holds (duplicate add → `ConflictError`).
- Ranking stays gap-free 1..n after reorder; reorder rejects an id set that isn't the current
  PLAYED set.
- Null/undefined handling respects `noUncheckedIndexedAccess` (array/record access guarded).

---

## 3. Performance (watch closely)

- **N+1 queries.** Flag a loop that calls a repo/Prisma per item. Reads that need related rows
  must use Prisma `include`/`select` (e.g. entries joined with their game in one query), not a
  query per entry. Batch writes go through one `$transaction` (see `setRanks`), not a loop of
  awaited updates issued serially when they could be batched.
- **Duplicated / redundant calls.** Flag the same data fetched twice in one flow, a service
  calling `findById` repeatedly for the same id, or a component triggering the same query from
  multiple places instead of sharing one hook.
- **Inefficient external calls.** IGDB/CheapShark must be called on demand, never in a loop over
  a list (CheapShark rate-limits). Flag any wishlist-wide price fetch loop. IGDB token must be
  cached/reused, not re-requested per call.
- **Over-fetching.** Flag selecting/returning more than the UI needs, or `findMany` without a
  `where`/bound when the set can grow.
- **Frontend re-render / refetch storms.** Flag missing or unstable TanStack Query keys,
  mutations that invalidate too broadly (whole cache vs the affected key), missing debounce on
  search-as-you-type, new object/array/function props created inline each render that defeat
  memoisation, and effects with wrong dependency arrays.
- **DB indexes.** Flag a frequent query path (e.g. by `status`/`rank`) with no supporting index
  in `schema.prisma`.

---

## 4. Code quality

- **No `any`.** `unknown` + narrowing instead. No unnecessary type assertions (`as`).
- **Explicit return types** on exported functions; types/contracts from `shared/`.
- **Small functions, one concern.** Flag high cognitive complexity / deep nesting / long
  functions even if under the lint cap if a clean extraction exists.
- **No magic values** — named constants (HTTP codes excepted).
- **Single source of truth (treat duplication as a defect).** Flag any rule/type/constant
  defined in more than one place, and any repeated UI that should be a shared presentational
  component (e.g. duplicated loading/error markup, copy-pasted button JSX, repeated cards). The
  fix is always "extract and import once" — cross-stack → `shared/`, business rules → `domain/`,
  reusable UI → `frontend/src/components/`.
- **Self-documenting names**; comments explain *why*. No commented-out code, no dead code.
- Consistent naming (`*.service.ts`, `*.repo.ts`, `*.controller.ts`, `useXxx`, PascalCase
  components).

---

## 5. Tests

- New pure logic (`shared/`, backend `domain/`) has unit tests covering branches and edges.
- New use cases / endpoints have service or supertest coverage via the in-memory port fakes —
  **no real network or DB in tests**; frontend mocks the `api/` boundary.
- Presentational components tested by props→output; interactions test what the user sees.
- One behaviour per test, Arrange–Act–Assert, descriptive name. Don't chase coverage %; do
  cover the high-value paths (the move/reorder/price rules, validation rejections).

---

## Output format

For each finding: `path:line — <severity> — <problem>. <fix>.`
Severities: **blocker** (boundary break, bug, security, N+1 on a hot path) > **major** > **minor**
> **nit**. End with a one-line verdict (safe to merge / changes required). No filler, no praise.
