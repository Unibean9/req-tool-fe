# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* are baked into the client bundle at build time. Most of these
# are substituted for the real runtime env at container startup (see
# docker-entrypoint.sh) so Dokploy/.env can change them without rebuilding.
# NEXT_PUBLIC_APP_URL is the exception: app/sitemap.ts and app/robots.ts run
# at build time and construct real URL objects from it, so it must be a
# valid absolute URL already at build time — keep it as a real build ARG.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=__RUNTIME_NEXT_PUBLIC_API_URL__ \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_COOKIE_DOMAIN=__RUNTIME_NEXT_PUBLIC_COOKIE_DOMAIN__ \
    NEXT_PUBLIC_ENV=__RUNTIME_NEXT_PUBLIC_ENV__ \
    NEXT_PUBLIC_POST_LOGIN_PATH=__RUNTIME_NEXT_PUBLIC_POST_LOGIN_PATH__ \
    NEXT_PUBLIC_SEO_SUBJECTS_PATH=__RUNTIME_NEXT_PUBLIC_SEO_SUBJECTS_PATH__ \
    NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=5174 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs docker/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 5174

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5174/ || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
