# syntax=docker/dockerfile:1.7

# ----------------------------------------------------------------
# Multi-stage build for the Next.js 16 frontend.
#
# Pairs with `output: "standalone"` in `next.config.ts` — Next emits a
# pre-bundled `.next/standalone` directory that only needs the static
# assets copied alongside it to run.
#
# Stages:
#   1. deps    — install all dependencies
#   2. builder — `next build` produces .next/standalone + .next/static
#   3. runner  — slim image: standalone server + static + public
# ----------------------------------------------------------------

ARG NODE_VERSION=20-alpine

# ---------- Stage 1: deps ----------
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Project uses pnpm — corepack ships with Node 20 and pins the version
# from package.json's `packageManager` field if set, falling back to
# the latest pnpm 10 line otherwise.
RUN corepack enable && corepack prepare pnpm@10 --activate

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- Stage 2: builder ----------
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next's anonymous telemetry in builds we ship.
ENV NEXT_TELEMETRY_DISABLED=1

# `next build` reads NEXT_PUBLIC_* env at build time and bakes them into
# the bundle. The project deliberately avoids NEXT_PUBLIC_* (BRD §7 — see
# `BACKEND_API_URL` rename), so there's nothing to inject here. If that
# changes, add `--build-arg NEXT_PUBLIC_X=...` and `ARG NEXT_PUBLIC_X` +
# `ENV NEXT_PUBLIC_X=$NEXT_PUBLIC_X` above this line.
RUN pnpm build

# ---------- Stage 3: runner ----------
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

RUN apk add --no-cache tini

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the standalone build + the static assets it doesn't bundle.
# `public/` (images, fonts) is referenced by Next at runtime; without
# it the site renders but every <img src="/..."> 404s.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
