# Dev image for the frontend (Vite dev server). Build context is the repo root.
FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
RUN pnpm install --frozen-lockfile

COPY shared/ ./shared/
COPY frontend/ ./frontend/

WORKDIR /app/frontend
EXPOSE 5173
# --host so the dev server is reachable from outside the container.
# BACKEND_URL (proxy target) is supplied by compose.
CMD ["pnpm", "exec", "vite", "--host"]
