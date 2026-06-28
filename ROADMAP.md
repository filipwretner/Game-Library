# Roadmap

Build order from the spec (§14). Milestones 0–6 are complete; **M7 (polish)** is the
remaining work, detailed below. See `game-tracker-spec (1).md` for the full spec and the
three `CLAUDE.md` files for the rules every change must follow.

## Status

| # | Milestone | Status |
|---|-----------|--------|
| 0 | Tooling baseline (pnpm monorepo, strict TS, ESLint boundaries, Husky, Vitest) | ✅ |
| 1 | Skeleton (layered backend, Prisma/SQLite, hooks-driven frontend, Docker, `/api/health`) | ✅ |
| 2 | IGDB proxy + game search (AddGameModal) | ✅ |
| 3 | Entries CRUD + Played view | ✅ |
| 4 | Ranking (drag-to-reorder, `PUT /api/entries/rank`) | ✅ |
| 5 | Backlog + Wishlist views + list-to-list moves + tab nav | ✅ |
| 6 | Pricing (CheapShark PC auto-fetch, PS5 manual, sale display, wishlist total) | ✅ |
| 7 | **Polish** | ⏳ planned |

Quality bar to keep green every commit: `pnpm lint && pnpm typecheck && pnpm test && pnpm format:check` (also enforced by the pre-commit hook and CI).

---

## M7 — Polish

Smaller, mostly additive work. Each item ships with its tests and stays within the existing
architecture (no new layers). Items are independent — pick any order.

### 1. Notes editing
- Free-text `notes` already exists on every entry (DB + `Entry` type + `PATCH` validator).
- Frontend: a small presentational `NotesField` (ephemeral input state) + reuse `useUpdateEntry`
  to persist `{ notes }`. Surface it on the Played rows and/or Backlog/Wishlist cards.
- Tests: component render + a view interaction (edit → `update` called with `{ notes }`).

### 2. Completion date on Played
- `dateCompleted` is set when a backlog game is marked completed (M5) but isn't shown yet.
- Frontend: display the formatted date on `RankRow` when present. Optionally allow editing it
  via `useUpdateEntry`.
- Keep formatting in a small pure helper (or a logic hook), not inline in JSX.

### 3. Sort toggle on Played (optional)
- Spec defaults Played to `rank`. Ordinal-only was chosen, so there is no rating sort — this is
  only worth doing if a second view (e.g. by completion date) is wanted. Skip unless desired.

### 4. Backups & docs
- Document the SQLite backup story in `README.md`: the whole DB is `backend/data/app.db`; back
  up by copying that file (already git-ignored). Note the Docker volume persists it.
- Flesh out `README.md`: what the app is, prerequisites, `.env` setup (Twitch IGDB creds), how
  to run (`pnpm dev` per workspace or `docker compose up`), and the test/lint commands.

### 5. Styling / theme (optional but high-impact)
- The app currently has **no CSS** — it renders unstyled. Wire the dark-theme design tokens
  defined in `frontend/CLAUDE.md` (CSS custom properties: `--bg`, `--surface`, `--accent`,
  `--pc`, `--ps5`, `--sale`, …) as the single source of colour truth.
- Apply them via the existing `className`/`data-*` hooks already on components (`platform-badge`
  `data-platform`, `sale-badge`, `rank-row`, `card-list`, `price-tag`, etc.) — no logic changes,
  styling only. Keep colour decisions in the tokens, never hard-coded per component.

### 6. Small UX touches (nice-to-have)
- Loading/disabled states on mutation buttons (some already done, e.g. fetch-price).
- Link the CheapShark `dealUrl` from a priced wishlist item (open the deal).
- Empty-state copy polish; confirm-on-delete if desired.

---

## Deliberately deferred (post-M7)

- **End-to-end tests** (Playwright/Cypress) — component + integration bands already cover most
  regressions for a single-user app (spec §11.5).
- **IsThereAnyDeal (ITAD)** — only needed for price-history / "notify at target price". Swapping
  it in is a single new `PriceProvider` implementation behind the existing port (spec §2.2).
- **Multi-currency** — currency is pinned to USD by decision; revisit only if buying in SEK etc.


## Another next step
The ability to add custom lists. Essentially a view on the page that has some sort of "Create List" button that lets you add a title. Then in that list we essentially have the same functionality as the rest of the views: A search bar for games, displaying them in a list and letting us rank them. Could be cool to have in your library something like "Top 10 Games of 20xx".