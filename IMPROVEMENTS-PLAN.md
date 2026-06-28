# Improvements Plan (2026-06-29)

Research + implementation plan for the next batch of changes. Pick up from here. Each item
ships with its tests and stays within the existing architecture (no new layers). Ordered
roughly easiest → hardest; items 5–6 are the same fix, and 1 + 3 are best done together.

Keep the gate green throughout: `pnpm lint && pnpm typecheck && pnpm test && pnpm format:check`.

---

## Research findings (IGDB, verified live)

- **`category` is dead.** IGDB now uses **`game_type`** (integer enum). Querying `category`
  returns nothing; `where category=0` returns `[]`.
- **DLC/cosmetics are `game_type` 1/13 with a `parent_game`.** Searching "batman arkham knight"
  without a filter returns ~12 skin packs and the **main game doesn't even appear** — this is
  the root cause of both the DLC noise (item 5) and the "must type the full name" bug (item 6).
- **`where game_type = 0` (main_game) fixes it.** Same search then returns exactly
  `Batman: Arkham Knight (2015)`. Partial queries also work (`"elden"` → Elden Ring). `search`
  and `where` combine fine in one Apicalypse query.
- **`first_release_date` is the original release** (earliest across regions/platforms for that
  game entity). Remasters/re-releases are separate IGDB entities, so a game's own
  `first_release_date` is the original date we want. Arkham Knight → 2015 ✓.
- **`game_type` enum**: 0 main_game, 1 dlc_addon, 2 expansion, 3 bundle, 4 standalone_expansion,
  5 mod, 6 episode, 7 season, 8 remake, 9 remaster, 10 expanded_game, 11 port, 12 fork, 13 pack,
  14 update. (Editions like "GOTY"/"Collector's" sometimes still come back as 0 — acceptable.)

---

## 5 + 6. Games-only search (also fixes the "buggy" search)  — small, do first

**Problem:** searching shows DLC/cosmetic packs; the real game is buried unless you type the
full name.

**Fix:** filter the IGDB search to main games.
- `backend/src/integrations/igdb/igdbMetadataProvider.ts` → `buildSearchQuery`: add
  `where game_type = 0;` and request `game_type` in `fields`. Consider broadening later to
  `where game_type = (0,8,9,10,11);` if we want remakes/remasters/ports too — start with `0`.
- Bump `SEARCH_LIMIT` 10 → ~15 so good matches aren't cut off.
- Unit test: feed the provider a fake client; assert the body contains `where game_type = 0`
  and that DLC rows are excluded (the real exclusion is server-side, so test the query string +
  mapping).

**Risk:** none material. Editions may still appear; fine for v1.

---

## 4. Played count in the header — small

**Problem:** Wishlist shows a "Total"; Played should show how many games.

**Fix:** mirror the wishlist-total header. In `PlayedView`, show `{n} games` (n = entries.length)
when there are entries. Extract a tiny presentational `ListHeader`/count element so Played,
Backlog and Wishlist share one header pattern (SSOT — see CLAUDE.md). Backlog can show a count
too for consistency.

- Files: `frontend/src/features/played/PlayedView.tsx` (+ a small `components/` header piece).
- Test: PlayedView shows the count.

---

## 2. Release year next to the title — small/medium

**Problem:** want the (original) release year beside each game title.

**Data:** `entry.game.releaseDate` is already stored (from `getByIgdbId`'s `first_release_date`)
— and it's the original date (see research). So Played/Backlog/Wishlist cards already have it.
Search results currently drop it.

**Fix:**
- Add a pure helper `releaseYear(iso: string | null): number | null` in `shared/` (or a frontend
  format util) — single source, unit-tested.
- Show `Title (2015)` on the cards (muted year).
- Add `releaseDate` (or just the year) to `GameSearchResult` in `shared/`, map it in the IGDB
  provider's `toSearchResult` (the field is already fetched), and show it in `SearchResultGrid`.

**Risk:** a game with no `first_release_date` → show title only (guard the null).

---

## 1 + 3. Two-row card layout + ranking on every list — medium/large, do together

These two couple: ranking-everywhere means Backlog/Wishlist need the same sortable, drag-handled
row as Played, so it's the moment to unify the card into one two-row component.

### 1. Two-row card

**Problem:** long titles push the Remove button onto a new line; layout jumps.

**Target layout (all lists):**
- **Top row:** cover, title + **release year** (item 2), platform badge. Title may wrap; the
  year sits inline in the title row, making it longer — which is exactly why the buttons move
  to their own row.
- **Bottom row, right-aligned (`justify-end`):** price (wishlist) + action buttons + Remove.

Replace the single-flex `GameCard`/`RankRow` with one `EntryCard` that renders two rows and
takes the drag-handle bindings + an actions slot. Reserves space so buttons never reflow.

### 3. Ranking for Backlog + Wishlist

**Backend:**
- Allow `rank` on **all** statuses (today it's PLAYED-only).
  - `addEntry`: assign `nextRankFor(status)` for every status (append), not just PLAYED.
  - `applyStatusTransition` / `resetFieldsForStatus`: when moving lists, **append** to the new
    list's rank instead of nulling it. Stop clearing `rank` for BACKLOG/WISHLIST.
  - `reorderPlayed` → generalise to `reorderEntries(status, orderedIds)`; validate the ids are
    exactly the current set **for that status**.
- HTTP: `PUT /api/entries/rank` body gains `status` (`{ status, orderedEntryIds }`); validator +
  controller updated. `findByStatus` already orders by `rank` so reads are unchanged.
- `recomputeRanks` is unchanged (already status-agnostic).
- Tests: reorder a Backlog/Wishlist list; move between lists appends rank; duplicate/foreign ids
  still rejected.

**Frontend:**
- Generalise `RankList` to render the unified `EntryCard` for any status, and
  `useReorderEntries` to take a `status` (today it hardcodes `['entries','PLAYED']`).
- Backlog and Wishlist views render the sortable list instead of a plain `<ul>`.
- Drag handle + dnd context already exist (`@dnd-kit`); reuse them.
- Tests: Backlog/Wishlist render sortable rows; reorder calls the mutation with the right status.

**Risk:** the move-between-lists rank logic is the fiddly part — cover it with service tests.
Data migration: existing Backlog/Wishlist rows have `rank = null`; backfill on first read or
lazily assign on first reorder (decide during impl; a one-off `setRanks` per list is simplest).

---

## Forward-looking (already noted in ROADMAP.md)

- **Custom lists** ("Top 10 Games of 20xx") — a user-created list with its own search + ranked
  entries. The ranking-everywhere work (item 3, rank per list) is the foundation; a custom list
  becomes "another status/list id" with the same sortable UI. Tackle after this batch.

---

## Suggested order for tomorrow

1. **Search filter (5+6)** — one-file backend change, immediate quality win.
2. **Played count (4)** — tiny.
3. **Release year (2)** — small, touches shared + search results.
4. **Unified two-row card + ranking everywhere (1+3)** — the big one; backend rank
   generalisation first (with tests), then the frontend `EntryCard` + sortable lists.
