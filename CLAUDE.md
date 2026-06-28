# Game Tracker — Project Guide (root)

Personal, single-user web app for tracking games across three lists: **Played** (ranked),
**Backlog** (owned, unplayed), and **Wishlist** (wanted, with price). "Letterboxd for games."
See `game-tracker-spec (1).md` for the full product/architecture spec.

This file holds rules that apply to the **whole repo**. The `backend/` and `frontend/`
folders each have their own `CLAUDE.md` with layer-specific rules — read the relevant one
before working in that workspace.

---

## Locked product decisions

These override the spec where they differ. Do not reintroduce the alternatives.

- **Ranking is ordinal only.** The Played list is hand-ordered by drag-and-drop; `rank` is
  the position (1 = best). There is **no `rating` field** and no rank/rating sort toggle.
- **Currency is USD**, pinned everywhere. Pass it to CheapShark where supported.
- **One list per game.** A game has exactly one entry; moving lists changes `status`.
- **PS5 prices are entered manually** (no free PS Store API). PC prices fetch via CheapShark.

---

## Repository layout (pnpm monorepo)

```
game-tracker/
  shared/      // types + pure domain logic (no I/O) — imported by both sides
  backend/     // Express + Prisma (depends on shared/)
  frontend/    // React + Vite (depends on shared/)
  docker-compose.yml
```

`shared/` is the single home for cross-stack contracts and pure rules. The platform rule
(`preferredPlatform`) and data contracts (`Entry`, `Game`, `GameSearchResult`, `PriceQuote`)
live there and are imported on both sides — **never re-declared or re-implemented** per
workspace. If a type or pure rule is needed in both backend and frontend, it belongs in
`shared/`.

Package manager is **pnpm** (workspaces). Use `pnpm`, not `npm`/`yarn`.

---

## Commands

Run from the repo root:

| Command | What |
|---------|------|
| `pnpm install` | Install all workspaces |
| `pnpm lint` | ESLint across the repo (architecture + correctness) |
| `pnpm typecheck` | `tsc --noEmit` in every workspace |
| `pnpm test` | Vitest in every workspace |
| `pnpm format` / `pnpm format:check` | Prettier write / check |

A pre-commit hook (Husky + lint-staged) runs Prettier, ESLint, typecheck and tests on
commit. **Do not bypass it** (`--no-verify`) — fix the cause instead.

## CI/CD

`.github/workflows/ci.yml` runs on push/PR to `main`:

1. **quality** — install, Prisma generate, `format:check` → `lint` → `typecheck` → `test`
   → `pnpm -r build`. Mirror of the local gates; keep them green before pushing.
2. **docker** — `docker compose build`, start the stack with dummy IGDB creds, smoke-test
   `/api/health` directly and through the frontend proxy, then tear down.
3. **publish** — on push to `main` only, builds and pushes both images to GHCR
   (`ghcr.io/<owner>/game-tracker-{backend,frontend}`).

The CI commands must match the local scripts — if you change a script name or add a
workspace, update the workflow too.

---

## TypeScript rules (whole repo)

The base config (`tsconfig.base.json`) is `strict: true` plus `noUncheckedIndexedAccess`,
`noImplicitOverride`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`.

- **No `any`.** Use `unknown` + narrowing when a type is genuinely open. `any` is an ESLint
  error, not a warning. The lone exception is response bodies in tests (supertest), already
  relaxed in the test ESLint override.
- **Explicit return types on exported functions.** Let inference handle locals.
- **Respect `noUncheckedIndexedAccess`.** Indexing an array/record yields `T | undefined` —
  handle the `undefined` (optional chaining, guards), don't assert it away.
- **Cross-stack types come from `shared/`.** Never redeclare an `Entry`/`Game` shape locally.
- **Prefer `interface` for object contracts**, `type` for unions/aliases.
- Unused args that exist for signature/arity reasons must be prefixed `_` (e.g. the `_next`
  in Express error middleware).

---

## Clean code rules

- **Small functions, one responsibility each.** Favour several readable functions over one
  large branching one. ESLint enforces this: `complexity`, `max-depth`, `max-lines-per-function`,
  and `sonarjs/cognitive-complexity` are capped. A flagged function is a prompt to extract,
  not to add a disable comment.
- **No magic values.** Name constants (e.g. `IGDB_PC = 6`, HTTP-adjacent numbers). The
  exception list in ESLint covers well-known HTTP status codes only.
- **Self-documenting names.** Comments explain *why*, not *what*. Delete commented-out code.
- **Single source of truth (no duplication).** Every rule, type, constant, and piece of UI is
  defined in exactly one place and imported everywhere it's needed — never copy-pasted:
  - Cross-stack rules/types → `shared/`. Backend business rules → `domain/`.
  - Repeated UI (buttons, loading/error states, badges, cards) → one presentational component
    in `frontend/src/components/`, reused by every view. If you write the same JSX/markup a
    second time, extract it.
  - Repeated literals → a single named constant.
  If you catch yourself duplicating, stop and extract — duplication is treated as a defect in
  review.
- **Typed errors, centralised handling.** No swallowed errors, no scattered `try/catch` noise
  (see `backend/CLAUDE.md` for the backend error pattern).

---

## Architectural boundaries are lint-enforced

The separation-of-concerns rules in `backend/CLAUDE.md` and `frontend/CLAUDE.md` are not
honour-system — they are ESLint errors (`no-restricted-imports` zones in `eslint.config.js`):

- `shared/` and backend `domain/` may **not** import Prisma, Express, or React (pure layers).
- Backend `services/` may **not** import `PrismaClient` or concrete providers — ports only.
- Frontend `components/` may **not** import the `api/` layer — go through hooks.

If you need to cross a boundary, you are probably putting code in the wrong layer. Move the
code, don't weaken the rule.

---

## Naming conventions

- Files: `*.service.ts`, `*.controller.ts`, `*.routes.ts`, `*.validators.ts`, `*.repo.ts`
  (backend); `useXxx` hooks and `PascalCase.tsx` components (frontend).
- Tests co-located as `*.test.ts(x)` next to the source.
- One behaviour per test; Arrange–Act–Assert; descriptive names stating expected behaviour.

---

## Tooling packages (root) — what and why

| Package | Why it's here |
|---------|---------------|
| `typescript` | Strict typing across all workspaces; one shared base config. |
| `eslint`, `@eslint/js`, `typescript-eslint` | Flat-config linting with type-aware rules. |
| `eslint-plugin-sonarjs` | Cognitive-complexity + code-smell rules (readonly props, nested-ternary, etc.). |
| `eslint-config-prettier` | Turns off ESLint rules that overlap Prettier — formatting vs correctness, no arguing. |
| `prettier` | The single formatter. Owns layout; never fight it manually. |
| `husky`, `lint-staged` | Pre-commit gate: format + lint + typecheck + test staged code. |
| `vitest` | One test runner across all workspaces (TS-native, fast). |
| `globals` | Provides env globals (node/browser) to the ESLint flat config. |

**When you add a package, document it** in the relevant workspace `CLAUDE.md` table: what it
is and how it should be used in our code. Every dependency must have a stated intent.
