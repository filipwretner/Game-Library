# Game Tracker — Technical Specification

A personal, single-user web app for tracking completed games (with rankings), a
backlog of owned-but-unplayed games, and a wishlist of wanted games with prices.
Think "Letterboxd for games" with a first-class backlog system.

> Status: draft spec, intended as a base for development. Sections marked
> **[Decision needed]** are open questions for you to confirm before/while building.

---

## 1. Goals & scope

**In scope (from requirements):**

1. A **Played** list of completed games; add new games as you finish them.
2. **Ranking** of all games in the Played list (ordered, best-to-worst).
3. A **Backlog** of owned games you haven't played yet.
4. A **Wishlist** of games you want but don't own, including a **price**.
5. **Platform prioritisation**: prefer PC; fall back to PS5 only when a game has no
   PC release.

**Explicitly out of scope** (personal app — keep it simple):

- Multi-user accounts, auth, sharing, social features.
- Horizontal scalability, high availability, complex caching layers.
- Mobile-native apps (responsive web is enough).

**Design principle:** single user, runs locally (or on a small personal server) via
Docker. Optimise for low complexity and ease of iteration over robustness at scale.

---

## 2. Key research findings (external data sources)

This is the part that most shapes the architecture, so it's worth reading first.

### 2.1 Game metadata — IGDB

[IGDB](https://api-docs.igdb.com/) is the de-facto database for game metadata: titles,
cover art, release dates, genres, and — critically for us — **per-game platform
availability**, which drives the PC-vs-PS5 logic.

- **Free** for non-commercial use.
- **Auth:** OAuth2 via Twitch. You register an app in the Twitch developer console to
  get a `Client ID` + `Client Secret`, then exchange them for a bearer token
  (`POST https://id.twitch.tv/oauth2/token?...&grant_type=client_credentials`). The
  token lasts ~60 days; cache it and refresh on expiry.
- **Base URL:** `https://api.igdb.com/v4`. Every request is a `POST` with an
  Apicalypse query body and headers `Client-ID` + `Authorization: Bearer <token>`.
- **Important:** the client secret must never reach the frontend, so **all IGDB calls
  go through our backend** (see §7).
- **Relevant platform IDs:** PC (Microsoft Windows) = `6`, PlayStation 5 = `167`.
  These power the prioritisation logic in §6.

### 2.2 PC pricing — CheapShark (recommended) vs IsThereAnyDeal

For the wishlist price of **PC** games:

- **[CheapShark](https://apidocs.cheapshark.com/) — recommended for v1.** Completely
  free, **no API key / no auth**, CORS-enabled, aggregates Steam, GOG, Epic, Humble,
  GreenManGaming and 30+ stores. Endpoints: `/deals`, `/games`, `/stores`.
  - Constraints: it's meant for live, user-triggered lookups, **not** bulk catalogue
    scraping (excessive automated requests get rate-limited/blocked). It also requires
    a `User-Agent` header. Both are easy to satisfy if we proxy through our backend and
    only fetch on demand.
  - Terms: when linking out to a deal, use CheapShark redirect links.
- **[IsThereAnyDeal (ITAD)](https://docs.isthereanydeal.com/) — optional upgrade.**
  More powerful (historical lows, 50+ stores, waitlist/collection sync) but needs an
  API key (+ OAuth for user-specific data). Its terms forbid building a *competitor*,
  which a personal tracker isn't, but it's more setup than we need for v1. Consider it
  later if you want price-history charts or "notify me at target price".

**Recommendation:** start with CheapShark; keep the pricing layer behind an interface
so ITAD can be swapped in later without touching the rest of the app.

### 2.3 PS5 pricing — the one real gap

There is **no good free public API for PlayStation Store prices.** Options are scraping
(fragile, against ToS) or third-party paid scrapers. For a personal app this isn't
worth the hassle.

**Recommendation:** for PS5 wishlist items, support **manual price entry** (you type
the price you see in the PS Store). PC items get an automatic "fetch price" button via
CheapShark; PS5 items show an editable price field. This keeps the feature honest and
simple. The data model below treats `price` as a stored value that *can* be
auto-filled, not something always live-fetched.

---

## 3. Tech stack

| Layer        | Choice                                              | Why |
|--------------|-----------------------------------------------------|-----|
| Backend      | Node.js + Express + TypeScript                      | Your preference; minimal and well-trodden. |
| Frontend     | React + TypeScript via **Vite**                     | Fast dev server, simple build. |
| Database     | **SQLite** (file-based) via **Prisma** ORM          | Zero-config, single-file, perfect for one user; Prisma gives end-to-end TypeScript types. |
| Server state | **TanStack Query** (`@tanstack/react-query`)        | Owns all server data on the frontend: fetching, caching, invalidation — keeps fetch logic out of components. |
| Validation   | **Zod**                                             | Validates inbound requests at the backend HTTP boundary so inner layers can trust their inputs. |
| HTTP client  | `fetch` (built into Node 18+) or `axios`            | For IGDB/CheapShark calls. |
| Drag & drop  | `@dnd-kit/core` (+ `@dnd-kit/sortable`)             | For reordering the ranked list; modern, maintained. |
| Container    | Docker + docker-compose                             | One command to start. |
| Workspace    | **npm/pnpm workspaces** (monorepo)                  | Lets `frontend`, `backend`, and a `shared` package live in one repo and share types + pure domain logic (e.g. platform rules) without duplication. |

> SQLite + Prisma is the key simplifying choice: the whole database is one file
> (e.g. `data/app.db`) that you can back up by copying it. No DB server to run.

---

## 4. High-level architecture

```
┌─────────────────────────┐      HTTP/JSON      ┌──────────────────────────┐
│  React + TS frontend     │  ───────────────▶  │  Express + TS backend     │
│  (Vite dev / static build)│ ◀───────────────   │  /api/*                    │
└─────────────────────────┘                     │                            │
                                                 │  ┌──────────────────────┐ │
                                                 │  │ Prisma ─▶ SQLite file │ │
                                                 │  └──────────────────────┘ │
                                                 │  IGDB proxy (OAuth cached) │
                                                 │  CheapShark price proxy    │
                                                 └────────────┬───────────────┘
                                                              │ outbound HTTPS
                                                  ┌───────────┴───────────┐
                                                  │  IGDB   │  CheapShark  │
                                                  └─────────────────────────┘
```

The backend owns all secrets and all third-party calls. The frontend only ever talks to
our own `/api/*`. This avoids exposing the IGDB client secret and sidesteps CORS/rate
limits.

**Repository layout (monorepo).** Three workspaces share one repo so types and pure
domain logic are defined once and imported on both sides (see §8.3):

```
game-tracker/
  shared/      // types + pure domain logic (preferredPlatform, contracts) — no I/O
  backend/     // Express + Prisma (depends on shared/)
  frontend/    // React + Vite (depends on shared/)
  docker-compose.yml
```

---

## 5. Data model

Two core tables: **`games`** (cached metadata for any game we've referenced) and
**`entries`** (a game's presence on one of your three lists). Separating them means a
game can move Wishlist → Backlog → Played without re-fetching metadata, and the same
title is never duplicated.

### `games` — cached metadata from IGDB

| Field             | Type        | Notes |
|-------------------|-------------|-------|
| `id`              | int (PK)    | Local id. |
| `igdbId`          | int unique  | IGDB game id. |
| `title`          | string      | |
| `coverUrl`        | string?     | IGDB cover image URL. |
| `summary`         | string?     | Short description. |
| `releaseDate`     | date?       | First release. |
| `platforms`       | JSON        | Array of platform ids/names from IGDB. Drives §6. |
| `igdbRating`      | float?      | IGDB aggregate rating (optional display). |
| `cachedAt`        | datetime    | When metadata was last refreshed. |

### `entries` — a game on a list

| Field            | Type                                    | Notes |
|------------------|-----------------------------------------|-------|
| `id`             | int (PK)                                | |
| `gameId`         | int (FK → games.id)                     | |
| `status`         | enum `PLAYED` \| `BACKLOG` \| `WISHLIST`| Which list it's on. |
| `rank`           | int?                                    | Ordering within PLAYED (1 = best). Null for other statuses. |
| `rating`         | float?                                  | Optional personal score (e.g. 0–10). **[Decision needed]** — see §5.1. |
| `ownedPlatform`  | enum `PC` \| `PS5`?                      | For BACKLOG/PLAYED: which version you own/played. |
| `price`          | decimal?                                | WISHLIST only. Current/sale price. Auto-filled (PC) or manual (PS5). |
| `normalPrice`    | decimal?                                | WISHLIST + PC. The non-sale ("regular") price from CheapShark, for strike-through display. |
| `discountPct`    | int?                                    | WISHLIST + PC. Discount percentage when on sale (e.g. 40). Lets the UI show a "🔥 on sale" badge. |
| `priceCurrency`  | string?                                 | e.g. "USD", "SEK". |
| `priceStore`     | string?                                 | e.g. "Steam" (from CheapShark) or "PS Store". |
| `priceUpdatedAt` | datetime?                               | When price was last fetched/edited. |
| `dateCompleted`  | date?                                   | PLAYED only. |
| `notes`          | string?                                 | Free-text. |
| `createdAt`      | datetime                                | When added to this list. |

A game lives in exactly one list at a time (one entry per game). Moving a game between
lists updates `status` and clears/sets status-specific fields.

### 5.1 Ranking model — **[Decision needed]**

"Rank all the games" has two common interpretations; pick one (or combine):

- **(A) Ordinal ranking (Letterboxd-ish positional list).** You drag games into a strict
  order; `rank` = position. Best for "my #1 game of all time" lists. This spec assumes
  **(A)** as the primary mechanism (the `rank` field + `@dnd-kit` reorder UI).
- **(B) Rating-based.** You assign each game a score (stars / 0–10) via `rating`, and the
  list sorts by score. Easier to add a game without re-shuffling everything, but ties are
  common.

Recommended: support **both** — store a `rating` for quick scoring, and an explicit
`rank` for a hand-curated order. Default the Played view to sort by `rank`, with a toggle
to sort by `rating`. Confirm your preference and we'll trim if you only want one.

---

## 6. Platform prioritisation logic

A single helper, used wherever we display a game's "active" platform:

```ts
type Platform = "PC" | "PS5";

const IGDB_PC = 6;
const IGDB_PS5 = 167;

function preferredPlatform(platformIds: number[]): Platform | null {
  if (platformIds.includes(IGDB_PC)) return "PC";   // PC always wins
  if (platformIds.includes(IGDB_PS5)) return "PS5"; // fall back to PS5
  return null;                                       // neither (rare; show note)
}
```

- **Display:** show a PC badge when PC is available, otherwise a PS5 badge.
- **Wishlist pricing:** if `preferredPlatform === "PC"`, enable the CheapShark
  auto-fetch button. If `"PS5"`, show the manual price field (per §2.3).
- A game can be on both platforms — we still show/treat it as PC, matching your rule.

---

## 7. Backend architecture & API

The backend follows a **clean, layered architecture**. Each layer has one
responsibility, dependencies point **inward only**, and the two "details" that tend to
leak everywhere — Express and Prisma — are pushed to the edges. This keeps business logic
testable, prevents the classic "fat controller doing everything" problem, and is the kind
of structure that reads well in a portfolio.

### 7.1 Layers

From outermost (HTTP) to innermost (domain). **An outer layer may depend on an inner one;
never the reverse.**

1. **HTTP layer — `http/` (routes, controllers, middleware, validators).**
   Express routers + thin controllers. A controller's *only* job: validate the request
   (Zod), call one service method, and map the result (or error) to an HTTP response.
   No business logic, no Prisma, no third-party calls here.
2. **Service layer — `services/` (application / use cases).**
   Orchestrates a single use case: "add entry", "move entry between lists", "fetch &
   store price", "reorder Played". Coordinates repositories, providers, and domain logic.
   Depends only on *interfaces* (repository ports, provider ports) — never on Express or
   Prisma directly.
3. **Domain layer — `domain/` (entities + pure logic).**
   Plain TypeScript types and **pure functions** with no I/O: `preferredPlatform()`,
   ranking recomputation, best-price selection rules. This is the single home for business
   rules, so they're never duplicated across services or controllers.
4. **Repository layer — `repositories/` (data access).**
   The **only** place Prisma is touched. Exposes intention-revealing methods
   (`entriesRepo.findByStatus`, `gamesRepo.upsertByIgdbId`) that return domain types.
   Swapping the DB later means rewriting only this layer.
5. **Integration layer — `integrations/` (external APIs behind ports).**
   IGDB and CheapShark clients, each hidden behind an interface (`MetadataProvider`,
   `PriceProvider`). Services depend on the interface, so CheapShark→ITAD is a one-file
   swap (§2.2).

### 7.2 Folder structure

```
backend/src/
  http/
    routes/            // entries.routes.ts, games.routes.ts, prices.routes.ts
    controllers/       // thin: validate → call service → respond
    middleware/        // errorHandler, requestLogger
    validators/        // Zod schemas per endpoint
  services/            // entryService, priceService, searchService (use cases)
  domain/
    types.ts           // Entry, Game, PriceQuote, Platform...
    platform.ts        // preferredPlatform() — see §6
    ranking.ts         // recomputeRanks(orderedIds)
    pricing.ts         // pickBestDeal(deals) selection rule
  repositories/
    ports.ts           // EntriesRepo, GamesRepo interfaces
    prisma/            // prismaClient.ts + PrismaEntriesRepo, PrismaGamesRepo
  integrations/
    ports.ts           // MetadataProvider, PriceProvider interfaces
    igdb/              // igdbClient (OAuth caching) + IgdbMetadataProvider
    cheapshark/        // CheapsharkPriceProvider
  config/              // typed env loading (validates IGDB creds at boot)
  app.ts               // composition root: wire concrete impls → services → routes
  server.ts            // app.listen()
```

### 7.3 Composition & dependency injection

`app.ts` is the **composition root**: it constructs the concrete repositories and
providers, injects them into services, injects services into controllers, and mounts the
routes. Dependencies are passed as constructor args / factory params — plain manual DI, no
framework needed at this scale. Inner layers receive interfaces, so nothing inner imports
a concrete Prisma or Express type.

### 7.4 Rules (reference while building)

- **Controllers stay thin** — no business logic, no DB, no `fetch`. If a controller grows
  branching logic, that logic belongs in a service or domain function.
- **Prisma only in repositories.** Services and domain never import `PrismaClient`.
- **External APIs only behind ports.** Services call `PriceProvider`, not CheapShark.
- **Business rules live once, in `domain/`** (pure, I/O-free) and are reused everywhere —
  this is how we avoid duplicated logic.
- **Validate at the boundary** (Zod in the HTTP layer) so services/domain can trust inputs.
- **Centralised error handling** — services throw typed domain errors; one error-handling
  middleware maps them to status codes. Controllers don't `try/catch` per-route.
- **Keep functions small, one concern each** — favour several small functions over one
  large one to keep cognitive complexity low.

### 7.5 API endpoints

All under `/api`. JSON in/out. No auth (single user, local). Controllers are thin wrappers
over the service methods described above.

### Search & metadata
- `GET /api/games/search?q=<title>` — proxy IGDB search; returns candidate games
  (title, cover, platforms, igdbId) to pick from when adding.
- `POST /api/games/:igdbId/refresh` — re-fetch/update cached metadata for a game.

### Entries (the three lists)
- `GET /api/entries?status=PLAYED|BACKLOG|WISHLIST` — list entries (joined with game
  metadata). Played returns sorted by `rank`.
- `POST /api/entries` — add a game to a list.
  Body: `{ igdbId, status, ownedPlatform?, dateCompleted?, notes? }`.
  Backend upserts the `games` row (fetching from IGDB if new), then creates the entry.
- `PATCH /api/entries/:id` — update fields (status change, rating, notes, price,
  dateCompleted, etc.). Moving lists = changing `status`.
- `DELETE /api/entries/:id` — remove from all lists.

### Ranking
- `PUT /api/entries/rank` — bulk-update Played ordering after a drag-and-drop.
  Body: `{ orderedEntryIds: number[] }`; backend writes `rank = index + 1`.

### Pricing (wishlist)
- `POST /api/entries/:id/fetch-price` — for a PC wishlist item, the `priceService` calls
  the `PriceProvider` (CheapShark), applies the `pickBestDeal` domain rule, and stores
  `price` (sale price), `normalPrice`, `discountPct`, `priceStore`, `priceCurrency`,
  `priceUpdatedAt`. Returns the updated entry. (No-op / 400 for PS5 items — those use
  manual `PATCH`.)
- `GET /api/wishlist/total` — convenience: sum of wishlist prices (handy for "how much
  to buy everything"). **[Decision needed]** currency handling if you mix USD/SEK — see
  §13.

> **Pricing abstraction:** put CheapShark behind a `PriceProvider` interface
> (`getBestPrice(title): Promise<PriceQuote | null>`). Swapping in ITAD later means one
> new implementation, no route changes.

---

## 8. Frontend architecture

The guiding rule: **components render, hooks and state hold logic.** A component file
should read like a template — destructure from a hook, map to JSX. Anything that *isn't*
"turn this data into markup" (fetching, mutations, computation, branching business rules)
lives outside the component. This keeps components small, cuts cognitive complexity, and
makes the logic independently testable.

### 8.1 Responsibilities by layer

- **Presentational components — `components/`.**
  Receive props, return JSX, emit callbacks (`onReorder`, `onMarkCompleted`). They hold
  **no** data fetching, **no** API calls, and **no** business logic. The only local state
  allowed is ephemeral pure-UI state (e.g. "is this dropdown open", "current input text").
  Display-only formatting is fine; computation is not.
- **Hooks — `hooks/`.** All logic lives here, split by purpose:
  - **Query hooks** (`hooks/queries/`) wrap TanStack Query reads:
    `usePlayedEntries()`, `useBacklog()`, `useWishlist()`, `useGameSearch(query)`.
  - **Mutation hooks** (`hooks/mutations/`) wrap writes + cache invalidation:
    `useAddEntry()`, `useReorderEntries()`, `useMoveEntry()`, `useFetchPrice()`.
  - **Logic hooks** (`hooks/logic/`) hold derived state and event handling:
    `useWishlistTotal(entries)`, `useSortedPlayed(entries, sortMode)`,
    `usePlatformBadge(game)`.
- **API layer — `api/`.** Typed wrappers, one function per backend endpoint
  (`entriesApi.list(status)`, `pricesApi.fetch(entryId)`). The **only** place that knows
  URLs and response shapes. Hooks call these; components never do.
- **Shared domain logic — `shared/` package (see §8.3).** Pure functions reused on both
  sides, e.g. `preferredPlatform()`. Imported by logic hooks so it's never re-implemented
  in a component.

### 8.2 Data flow

```
Component  ──renders──▶ JSX
    │  uses
    ▼
Hook (query / mutation / logic)
    │  calls
    ▼
api/ wrapper  ──HTTP──▶  /api/*        (server state cached by TanStack Query)
    │  uses
    ▼
shared/ domain logic (pure)
```

A component never reaches past the first hop. It talks to hooks; hooks talk to the API
layer and domain logic. **Server state lives in TanStack Query as the single source of
truth** — it is not copied into local `useState`, which avoids the duplicated/duplicating
state that causes stale-data bugs.

### 8.3 Folder structure

```
frontend/src/
  api/                 // client.ts (base fetch) + entriesApi, gamesApi, pricesApi
  hooks/
    queries/           // usePlayedEntries, useWishlist, useGameSearch...
    mutations/         // useAddEntry, useReorderEntries, useMoveEntry, useFetchPrice
    logic/             // useWishlistTotal, useSortedPlayed, usePlatformBadge
  components/          // presentational ONLY
    GameCard.tsx, PlatformBadge.tsx, PriceTag.tsx, SaleBadge.tsx,
    RankList.tsx, RankRow.tsx, SearchResultGrid.tsx ...
  features/            // each view = composition of components + hooks (little/no logic)
    played/PlayedView.tsx
    backlog/BacklogView.tsx
    wishlist/WishlistView.tsx
    add-game/AddGameModal.tsx
  app/                 // App.tsx, QueryClientProvider, tab navigation
  types/               // UI-facing types (re-exported from shared/)
```

A **`shared/` workspace package** (per §3) holds the types and pure domain logic used by
*both* frontend and backend — most importantly `preferredPlatform()` and the
`Entry`/`Game`/`PriceQuote` types. This is the concrete mechanism for "no duplicated
logic" across the stack: the platform rule and the data contracts are defined exactly
once and imported on both sides.

### 8.4 Rules (reference while building)

- **If a component contains fetching, a mutation, or non-trivial computation → extract it**
  into a hook (logic) or the `shared/` domain (pure function).
- **No `fetch`/`axios` in components or even directly in views** — only via the `api/`
  layer, reached through hooks.
- **Server state → TanStack Query only.** Local `useState` is for ephemeral UI state.
- **Derived values are computed in hooks** (memoised), not recomputed inline in JSX.
- **Keep components and functions small, one concern each** — a view composes
  presentational components and wires them to hooks; it shouldn't contain logic itself.
- **Shared rules come from `shared/`**, never re-implemented per component.

### 8.5 Key interactions (where the logic lives)

- **Add game:** `AddGameModal` renders a search box + results grid; `useGameSearch(query)`
  (debounce + query) supplies results; `useAddEntry()` performs the write. The modal holds
  only input state.
- **Played view:** `PlayedView` renders a `RankList` of `RankRow`s. `useSortedPlayed`
  provides ordering (rank vs rating toggle); `useReorderEntries()` commits drag-and-drop.
  `@dnd-kit` lives inside `RankList`; the row stays presentational.
- **Backlog view:** cards emit `onMarkCompleted` / `onMove`; `useMoveEntry()` handles the
  transition (and prompts for completion date/rank) — the card itself is dumb.
- **Wishlist view:** `PriceTag` + `SaleBadge` render price, strike-through `normalPrice`,
  and `discountPct`; `useFetchPrice()` (PC) and an inline edit→`useMoveEntry`/patch (PS5)
  handle updates; `useWishlistTotal(entries)` computes the header total.

---

## 9. External integration details

### IGDB token caching
- On first call, exchange Client ID/Secret for a bearer token; store token + expiry in
  memory (and optionally on disk so restarts don't re-auth). Refresh when within, say, a
  day of expiry. A tiny module (`igdbClient.ts`) wraps this and exposes `query(endpoint,
  apicalypseBody)`.

### IGDB query examples (Apicalypse)
- Search: body like `search "elden ring"; fields name,cover.url,platforms,first_release_date,summary; limit 10;`
- Note cover URLs come back at thumbnail size; swap the size token (e.g. `t_thumb` →
  `t_cover_big`) to get larger art.

### CheapShark
- Lookup by title: `GET https://www.cheapshark.com/api/1.0/deals?title=<name>` → the
  response includes `salePrice`, `normalPrice`, and `savings` (discount %) per deal. The
  `pickBestDeal` domain rule selects the lowest current `salePrice`; store the sale price,
  `normalPrice`, and rounded `savings` so the UI can show the discount and strike-through.
  Capture `storeID` (map via `/stores`) and build the redirect link
  `https://www.cheapshark.com/redirect?dealID=<dealID>`.
- Always send a `User-Agent`. Only call on user action (the fetch-price button), never in
  a loop over the whole wishlist.

---

## 10. Docker & running locally

`docker-compose.yml` with two services for dev, or a single combined image for "just run
it". Recommended dev layout:

- **`backend`** — Node image, runs Express on e.g. `:3001`, mounts `./data` for the
  SQLite file so it persists across container restarts. Reads `IGDB_CLIENT_ID` /
  `IGDB_CLIENT_SECRET` from env.
- **`frontend`** — Vite dev server on e.g. `:5173`, proxying `/api` to the backend.

For a simple "production" personal deploy, build the React app to static files and have
Express serve them, so it's a single container.

Secrets live in a git-ignored `.env`:
```
IGDB_CLIENT_ID=...
IGDB_CLIENT_SECRET=...
DATABASE_URL=file:./data/app.db
```

Back up your data by copying `data/app.db`.

---

## 11. Testing strategy

The layered architecture exists partly to make testing cheap: pure logic is isolated from
I/O, and external services sit behind ports that are trivial to mock. The strategy mirrors
the test pyramid — **lots of fast unit tests on pure logic, a focused band of integration
and component tests for behaviour, and end-to-end tests deferred for now.**

### 11.1 Tooling

| Concern                       | Tool |
|-------------------------------|------|
| Test runner (FE + BE)         | **Vitest** — fast, TS-native, one config style across all workspaces. |
| Backend HTTP-level tests      | **supertest** — drive Express routes in-process. |
| Frontend component/hook tests | **React Testing Library** (+ Vitest). |
| API mocking (frontend)        | **MSW** (Mock Service Worker) — intercept the `api/` layer at the network boundary. |
| Test database                 | A throwaway SQLite file (or `:memory:`), migrated fresh per run. |

### 11.2 Unit tests — pure logic (the bulk)

Everything in `shared/` and the backend `domain/` is pure (no I/O), so it's unit-tested
directly with plain inputs/outputs — no mocks, runs in milliseconds. These are the tests
you run constantly while building. Cover at minimum:

- `preferredPlatform()` — PC present → PC; only PS5 → PS5; both → PC; neither → null.
- `recomputeRanks()` — reordering produces a correct, gap-free 1..n sequence.
- `pickBestDeal()` — selects the lowest `salePrice`; handles "no deals" → null.
- `wishlistTotal()` / any formatting and sorting helpers.

Rule of thumb: **if a function has branching business logic, it should be pure and have a
unit test.** If it's hard to unit-test, that usually means logic leaked into a layer it
shouldn't be in.

### 11.3 Integration tests — backend behaviour

Test that the layers work *together* and that data actually moves correctly:

- **Service + repository against a real test DB.** e.g. "add a wishlist entry, then move
  it to Played" → assert the row's `status`, `rank`, and cleared price fields. The
  external `MetadataProvider`/`PriceProvider` are swapped for in-memory fakes via their
  ports, so no real IGDB/CheapShark calls happen.
- **HTTP endpoint tests (supertest).** Hit `POST /api/entries`, `PUT /api/entries/rank`,
  `POST /api/entries/:id/fetch-price` and assert status codes, response shape, and the
  resulting DB state. This covers controller → service → repository in one pass.
- Priority cases: add entry, move between lists, reorder ranking, fetch-price stores
  sale/normal/discount, validation rejects bad input (Zod).

### 11.4 Component tests — frontend behaviour

Two complementary kinds, both with React Testing Library:

- **Presentational components** — render with props, assert the right output. e.g.
  `SaleBadge` shows the discount and strike-through only when `discountPct` is set;
  `PlatformBadge` shows PC vs PS5 correctly. Because components are logic-free, these tests
  are simple and stable.
- **Hooks + interaction** — render a view (or a hook) with MSW faking `/api/*`, then
  simulate user actions and assert the right calls/UI changes. e.g. "type in Add-Game
  search → results render → click a result → `useAddEntry` fires"; "drag a rank row →
  reorder mutation called"; "click fetch-price → price + sale badge update". Test
  **behaviour the user sees**, not internal state.

### 11.5 What we deliberately don't test (yet)

- **End-to-end** (full browser via Playwright/Cypress) — **shelved.** Noted here as the
  natural later addition once the app is stable; the component + integration bands already
  cover most regressions for a personal app.
- Framework/library internals, trivial getters, and exact markup/styling — test behaviour
  and contracts, not implementation details.

### 11.6 Conventions

- Co-locate tests as `*.test.ts(x)` next to the source file.
- One behaviour per test; **Arrange–Act–Assert** structure; descriptive test names that
  state the expected behaviour ("moves entry to Played and clears price").
- No real network in any test — external ports are faked (backend) or MSW-mocked (frontend).
- Don't chase a coverage percentage. Prioritise the high-value, cheap targets: all pure
  domain logic and the critical use cases above.

---

## 12. Code quality rules

These keep the codebase consistent and readable — and, importantly, make the tooling
*enforce* the separation of concerns from §7–§8 rather than relying on discipline.

### 12.1 TypeScript

- **`strict: true`** everywhere, plus `noUncheckedIndexedAccess` and
  `noImplicitOverride`. No `any` — use `unknown` + narrowing when a type is genuinely
  open.
- Prefer explicit return types on exported functions; let inference handle locals.
- Types and contracts for cross-stack data come from `shared/` — never redeclared.

### 12.2 Linting & formatting

- **ESLint + Prettier**, with a single shared config at the repo root applied to all
  workspaces. Prettier owns formatting; ESLint owns correctness — no overlap/arguing.
- Enforce **cognitive complexity / size limits** via `eslint-plugin-sonarjs` (or the core
  `complexity` rule) plus `max-lines-per-function` and `max-depth`. A flagged function is a
  prompt to extract logic into a smaller function or a hook/domain helper.
- **Enforce architectural boundaries with the linter** (e.g. `eslint-plugin-boundaries` or
  `no-restricted-imports`):
  - `domain/` and `shared/` may not import Prisma, Express, or React.
  - Services may not import `PrismaClient` or concrete providers — interfaces only.
  - Frontend `components/` may not import the `api/` layer directly (must go via hooks).
  This turns the "rules" lists in §7.4 and §8.4 into build-time guarantees.

### 12.3 General rules

- **Small functions, one responsibility each.** Favour several readable functions over one
  large branching one — this directly lowers cognitive complexity.
- **No magic values** — named constants (e.g. the IGDB platform IDs in §6), not inline
  literals.
- **Self-documenting names**; comments explain *why*, not *what*. Delete commented-out code.
- **Typed errors + centralised handling** (per §7.4) — no swallowing errors, no
  per-route `try/catch` noise.
- **No duplicated logic** — shared rules live once in `shared/`/`domain/` and are imported.
- Consistent file/symbol naming (e.g. `*.service.ts`, `*.repo.ts`, `useXxx` hooks,
  PascalCase components).

### 12.4 Automation

- **Pre-commit hooks** via Husky + lint-staged: run Prettier, ESLint, and `tsc --noEmit`
  on staged files, and the relevant unit tests, before a commit lands.
- **CI (optional but recommended for portfolio):** a GitHub Actions workflow that runs
  typecheck + lint + the full test suite on push/PR. Cheap to add and a strong signal that
  the project is maintained to a real standard.

---

## 13. Open questions / decisions for you

1. **Ranking style (§5.1):** ordinal drag-order, rating score, or both? (Spec assumes
   both, defaulting to ordinal.)
2. **Currency:** what currency do you buy in (USD? SEK?)? Affects how prices display and
   whether the wishlist total needs any conversion. Simplest: pin everything to one
   currency you choose and pass it to CheapShark where supported.
3. **PS5 prices:** confirm you're OK with **manual entry** for PS5 wishlist items (no
   reliable free API). 
4. **Backlog → Played transition:** when you finish a backlog game, should it auto-prompt
   for a rank/rating and completion date? (Assumed yes.)
5. **Price history:** do you want just "current price", or eventually price-drop tracking?
   The latter is the main reason to move from CheapShark to IsThereAnyDeal later.
6. **One list at a time:** confirm a game should only ever be in one of the three lists
   (this spec assumes yes — a single entry per game).

---

## 14. Suggested build order (milestones)

0. **Tooling baseline:** monorepo workspaces, TypeScript strict config, ESLint/Prettier
   (incl. boundary rules), Vitest, Husky pre-commit. Get the quality gates in place first.
1. **Skeleton:** Vite React app + Express + Prisma/SQLite + Docker; `GET /api/health`.
2. **IGDB proxy:** token caching + `GET /api/games/search`; AddGameModal wired to it.
3. **Entries CRUD + Played list:** add/list/delete; basic Played view.
4. **Ranking:** `@dnd-kit` reorder + `PUT /api/entries/rank`.
5. **Backlog + Wishlist views** and list-to-list moves.
6. **Pricing:** CheapShark proxy + fetch-price button (PC) + manual price (PS5) + total,
   with sale/discount display.
7. **Polish:** platform badges, sorting toggles, notes, completion dates, backups.

Each milestone ships with its tests (§11): pure logic gets unit tests as it's written;
endpoints and views get integration/component tests as they land — not bolted on at the
end.

---

*Data sources: IGDB (metadata & platform availability, free non-commercial, Twitch OAuth2),
CheapShark (PC prices, free/no-auth), with IsThereAnyDeal as a future upgrade path for
price history. PS5 pricing handled via manual entry.*
