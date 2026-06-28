# Backend — Architecture Guide

Express + TypeScript + Prisma (SQLite). Read the root `CLAUDE.md` first for repo-wide rules
(TypeScript, clean code, naming). This file covers the **backend clean architecture** and
its layer rules.

The whole point of the layering: business logic stays testable, and the two "details" that
tend to leak everywhere — **Express** and **Prisma** — are pushed to the edges.

---

## Layers (dependencies point inward only)

From outermost (HTTP) to innermost (domain). An outer layer may depend on an inner one;
**never the reverse.**

```
src/
  http/                  // Express edge — routes, controllers, middleware, validators
    routes/              // *.routes.ts — wire paths to controllers
    controllers/         // thin: validate → call one service → respond
    middleware/          // errorHandler, asyncHandler
    validators/          // Zod schemas per endpoint
  services/              // application use cases (orchestration)
  domain/                // pure types + rules + typed errors (NO I/O)
  repositories/          // data access
    ports.ts             // EntriesRepo, GamesRepo interfaces
    prisma/              // the ONLY place @prisma/client is imported
  integrations/          // external APIs behind ports
    ports.ts             // MetadataProvider, PriceProvider interfaces
    igdb/                // igdbClient (OAuth cache) + IgdbMetadataProvider
    cheapshark/          // (M6) CheapsharkPriceProvider
  config/                // env.ts — Zod-validated env, fail-fast at boot
  container.ts           // composition root: build concrete impls → services
  app.ts                 // createApp(container) — mounts routes, returns app
  server.ts              // dotenv + loadEnv + buildContainer + listen
```

### 1. HTTP layer (`http/`)
Express routers + **thin controllers**. A controller's only job: validate the request (Zod),
call **one** service method, map the result/error to a response. **No business logic, no
Prisma, no `fetch` here.** If a controller grows branching logic, that logic belongs in a
service or in `domain/`.

Controllers are built by factories that receive their service via DI, e.g.
`makeGamesController(searchService)` returns `{ searchGames }`. Routes are factories too:
`gamesRoutes(searchService)`.

### 2. Service layer (`services/`)
Orchestrates a single use case ("search games", "add entry", "move entry", "fetch price").
Coordinates repositories, providers, and domain logic. **Depends only on interfaces**
(repository ports, provider ports) — never on Express or Prisma. A service is a class taking
its ports as constructor args.

### 3. Domain layer (`domain/`)
Plain types and **pure functions, no I/O**: ranking recomputation, best-price selection,
typed errors. The single home for business rules so they are never duplicated. Re-exports the
shared `preferredPlatform` rather than re-implementing it. **Must not import Prisma, Express,
or anything with side effects** (lint-enforced).

### 4. Repository layer (`repositories/`)
The **only** place Prisma is touched. Exposes intention-revealing methods
(`entriesRepo.findByStatus`, `gamesRepo.upsertByIgdbId`) defined as interfaces in `ports.ts`,
implemented in `prisma/`. Returns domain/shared types, **never raw Prisma rows** leaking
outward. Swapping the DB later means rewriting only this layer.

### 5. Integration layer (`integrations/`)
External APIs (IGDB, CheapShark) each hidden behind a port interface (`MetadataProvider`,
`PriceProvider`). Services depend on the interface, so CheapShark → ITAD later is a one-file
swap. The concrete client (e.g. `igdbClient`) handles transport/auth only; the provider maps
the external shape onto our port type.

---

## Composition & dependency injection

`container.ts` is the **composition root**: `buildContainer(env)` constructs the concrete
repositories and providers, injects them into services, and returns an `AppContainer`.
`createApp(container)` mounts routes using those services and returns the Express app
**without listening** (so tests can drive it via supertest). `server.ts` is the only place
that loads env, builds the container, and calls `listen`.

Manual DI — no framework. Inner layers receive interfaces; nothing inner imports a concrete
Prisma or Express type. To add a feature: define/extend the port → implement it → wire it in
`buildContainer` → inject into the service/controller → mount the route.

---

## Express rules

- **Thin controllers**, as above.
- **Async controllers** are typed `AsyncRequestHandler` (returns `Promise<unknown>`) and
  wrapped with `asyncHandler(...)` at the route so rejections reach the central error handler.
  Express 4 does not catch async rejections on its own.
- **No per-route `try/catch`.** Services/domain throw typed errors; throw them and let the
  middleware map them.

### Error handling
- Domain errors extend `DomainError` (in `domain/errors.ts`) and carry a `status` + `code`:
  `NotFoundError` (404), `ValidationError` (400), `ConflictError` (409),
  `BadGatewayError` (502, upstream/external failure).
- `errorHandler` middleware (mounted **last**) maps `DomainError` → its status + a
  `{ error: { code, message } }` envelope; anything else → 500. `notFoundHandler` handles
  unmatched routes.
- Throw the most specific error; don't return ad-hoc status codes from controllers.

### Validation
- Validate **at the HTTP boundary** with Zod (`http/validators/*`). On failure throw
  `ValidationError` with the first issue's message. Inner layers then trust their inputs —
  services/domain do not re-validate shapes.

---

## Prisma rules

- **`@prisma/client` is imported only under `repositories/prisma/`.** Services and domain
  never import `PrismaClient` (lint-enforced). One shared client instance in `prismaClient.ts`.
- SQLite has **no native enums**: `status` (`PLAYED|BACKLOG|WISHLIST`) and `ownedPlatform`
  (`PC|PS5`) are stored as strings, constrained by Zod at the boundary and the shared union
  types. Keep DB strings and the TS unions in sync.
- The schema has **no `rating` column** (ordinal-only ranking). `platforms` on `Game` is a
  JSON-encoded `number[]` string — parse it in the repository when mapping to the `Game` type.
- Migrations: `pnpm --filter @game-tracker/backend prisma:migrate` (dev) creates + applies a
  migration; commit the generated `prisma/migrations/` folder. Containers run
  `prisma migrate deploy` on start.
- The SQLite file lives under `backend/data/` (git-ignored; `DATABASE_URL=file:../data/app.db`
  relative to `prisma/`). Back up by copying the file.

---

## Testing guidelines (backend)

Vitest. The layering makes tests cheap: pure logic has no I/O, and external services sit
behind ports that are trivial to fake.

- **Unit tests (the bulk)** — everything in `domain/` and the provider mappers. Plain
  inputs/outputs, no mocks. e.g. `preferredPlatform`, `recomputeRanks`, `pickBestDeal`, and
  `IgdbMetadataProvider.search` with a fake `IgdbClient`.
- **Integration / HTTP tests (supertest)** — build the app with a container of **fakes**
  (`createApp({ searchService: new SearchService(fakeProvider) })`), hit the route, assert
  status + body + (where relevant) resulting DB state. Cover the happy path plus validation
  (400) and upstream failure (502).
- **No real network in any test.** Swap providers for in-memory fakes via their ports. For
  repository tests, use a throwaway SQLite file (or `:memory:`) migrated fresh per run.
- Co-locate as `*.test.ts`; one behaviour per test; AAA; descriptive names.

The test ESLint override relaxes `no-unsafe-*` and `unbound-method` (supertest bodies are
`any`; passing a mock method to `expect` is idiomatic).

---

## Packages (backend) — what and why

| Package | Why / how to use |
|---------|------------------|
| `express` | HTTP framework. Only in `http/` and `app.ts`. Routers + thin controllers. |
| `@prisma/client` | DB access. **Only** under `repositories/prisma/`. Inject the repo port elsewhere. |
| `prisma` (dev) | CLI/migrations/client generation. Run via the `prisma:*` scripts. |
| `zod` | Boundary validation (`validators/`) and env parsing (`config/env.ts`). Infer types from schemas with `z.infer`. |
| `dotenv` | Loads `backend/.env` in `server.ts` only (`import 'dotenv/config'`). Not used in the config layer or in containers (env comes from compose there). |
| `supertest` (dev) | Drives the Express app in-process for HTTP tests. |
| `tsx` (dev) | Runs/watches TS directly in dev (`pnpm dev`) without a build step. |
| `@types/*` (dev) | Node/Express/supertest type definitions. |

**New backend package → add a row here** stating what it is and where it may be used.
