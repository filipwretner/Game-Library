# Dev image for the backend. Build context is the repo root so the pnpm
# workspace (incl. the shared package) resolves correctly.
FROM node:22-slim

# pnpm via corepack (works fine inside the Linux image).
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

# Install deps first for layer caching. All workspace manifests must be present
# so the frozen lockfile resolves.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile

# Source.
COPY shared/ ./shared/
COPY backend/ ./backend/

WORKDIR /app/backend
RUN pnpm exec prisma generate

EXPOSE 3001
# Apply migrations, then start. DATABASE_URL is supplied by compose.
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec tsx src/server.ts"]
