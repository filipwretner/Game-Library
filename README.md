# Game Library

A personal, single-user web app for tracking games across three lists — **Played** (ranked),
**Backlog** (owned, unplayed), and **Wishlist** (wanted, with a price). Think "Letterboxd for
games" with a first-class backlog and live PC pricing.

Game metadata comes from **IGDB**; PC wishlist prices auto-fetch from **CheapShark** (PS5
prices are entered manually). It runs locally or on a small personal server via Docker.

## Features

- **Search & add** games (IGDB) to any list.
- **Played**: drag-to-reorder ranking (1 = best).
- **Backlog**: owned-but-unplayed; mark completed (→ Played) or move to Wishlist.
- **Wishlist**: PC items auto-fetch the cheapest current deal with sale/discount display;
  PS5 items take a manual price. Header shows the USD total.
- **Platform rule**: prefer PC; fall back to PS5 when there's no PC release.
- One list per game; moving between lists clears the old list's fields automatically.

## Tech stack

- **Backend** — Node + Express + TypeScript, layered (http → services → domain → repositories →
  integrations), Prisma + SQLite.
- **Frontend** — React + TypeScript via Vite, TanStack Query for all server state, `@dnd-kit`
  for drag-and-drop.
- **Shared** — a `shared/` workspace holds cross-stack types and pure domain rules.
- **Tooling** — pnpm monorepo, strict TypeScript, ESLint (architecture-boundary rules) +
  Prettier, Vitest, Husky pre-commit, GitHub Actions CI.

Architecture and conventions live in the `CLAUDE.md` files: [root](CLAUDE.md),
[backend](backend/CLAUDE.md), [frontend](frontend/CLAUDE.md). Build status and remaining work
are in [ROADMAP.md](ROADMAP.md).

## Prerequisites

- **Node 20+** and **pnpm** (`npm i -g pnpm`).
- **Docker** + Docker Compose (for the one-command run).
- **IGDB credentials** via Twitch — register an app at
  <https://dev.twitch.tv/console/apps> to get a `Client ID` + `Client Secret`. The OAuth
  redirect URL is unused (client-credentials flow); put `https://localhost`.

## Configuration

Secrets live in a git-ignored `.env`. Copy the example and fill in your IGDB credentials:

```bash
cp .env.example .env
# edit .env: IGDB_CLIENT_ID=...  IGDB_CLIENT_SECRET=...
```

`docker compose` reads this root `.env`. For running **locally** (without Docker) the backend
reads `backend/.env` — create it with at least:

```
DATABASE_URL="file:../data/app.db"
IGDB_CLIENT_ID=your_id
IGDB_CLIENT_SECRET=your_secret
```

## Run with Docker (one command)

Starts **both** the backend and the frontend, applies database migrations, and persists the
SQLite file under `./data`:

```bash
docker compose up --build
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3001/api/health>

Stop with `Ctrl+C`, or `docker compose down` (add `-v` to also remove the volume).

## Run locally (without Docker)

```bash
pnpm install          # install all workspaces
pnpm db:setup         # generate Prisma client + create/apply the SQLite migration
pnpm dev              # start backend (:3001) and frontend (:5173) together
```

`pnpm dev` runs both dev servers in parallel; the Vite dev server proxies `/api` to the
backend.

## Useful commands

Run from the repo root:

| Command | What |
|---------|------|
| `pnpm dev` | Start backend + frontend (local dev) |
| `pnpm lint` | ESLint across the repo (correctness + architecture boundaries) |
| `pnpm typecheck` | `tsc --noEmit` in every workspace |
| `pnpm test` | Vitest in every workspace |
| `pnpm format` / `pnpm format:check` | Prettier write / check |
| `pnpm db:setup` | Prisma generate + migrate (local DB) |

A Husky pre-commit hook runs format, lint, typecheck and tests on commit; CI repeats them on
push/PR.

## Data & backups

The entire database is a single SQLite file at **`backend/data/app.db`** (git-ignored; the
Docker volume keeps it across restarts). Back up by copying that file; restore by copying it
back.

## Project layout

```
game-library/
  shared/      // cross-stack types + pure domain logic (no I/O)
  backend/     // Express + Prisma (depends on shared/)
  frontend/    // React + Vite (depends on shared/)
  docker-compose.yml
```
