# Docker / CI/CD — req-tool-fe

Flow: push to `main` → GitHub Actions validates (lint + build) → builds & pushes Docker image to DockerHub (tags: `latest` + commit SHA) → **deploy is manual**.

There is no auto-deploy step in this pipeline. After a successful push, a human deploys via the Dokploy dashboard when ready.

## Local development

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

Requires a `.env` file at the repo root — copy `.env.example` and adjust:

```bash
cp .env.example .env
```

## GitHub Secrets required

| Secret | Used for |
|---|---|
| `DOCKER_USERNAME` | DockerHub login + image namespace |
| `DOCKER_PASSWORD` | DockerHub access token (not account password) |

No `DOKPLOY_*` secrets are needed — this pipeline does not call the Dokploy API.

## Build-time env vars (plain `env`, not secrets)

`NEXT_PUBLIC_*` values are public (shipped to the browser) and not sensitive, so they're set directly in the `env:` block of [.github/workflows/docker-publish.yml](../.github/workflows/docker-publish.yml) rather than as GitHub Secrets:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_COOKIE_DOMAIN`
- `NEXT_PUBLIC_ENV`
- `NEXT_PUBLIC_POST_LOGIN_PATH`
- `NEXT_PUBLIC_SEO_SUBJECTS_PATH`

Production values currently set:
- `NEXT_PUBLIC_API_URL` → `http://api-req.bean9.net/` (BE domain)
- `NEXT_PUBLIC_APP_URL` → `https://req.bean9.net/` (FE domain)
- `NEXT_PUBLIC_COOKIE_DOMAIN` → `.bean9.net` (shared root domain so the auth cookie set by the API is readable on the FE subdomain)

`NEXT_PUBLIC_POST_LOGIN_PATH` and `NEXT_PUBLIC_SEO_SUBJECTS_PATH` are still placeholders (app-internal paths, not domains) — edit them in the workflow file if they need to differ from `/dashboard` and `/subjects`.

**Important — these are build-time, not runtime, values.** Next.js inlines every `NEXT_PUBLIC_*` variable into the JS bundle when `npm run build` runs in the `publish` job. Once the image is built, those values are frozen inside it. A `.env` file set in the Dokploy UI is injected into the container at **runtime** — it has no effect on `NEXT_PUBLIC_*` values, since the bundle is already compiled. If a `NEXT_PUBLIC_*` value needs to change, edit it in `.github/workflows/docker-publish.yml` and rebuild/republish the image; don't expect a Dokploy-UI `.env` change to take effect for these.

A Dokploy-UI `.env` *is* the right place for genuinely runtime/server-side values (see the next section) — just not for anything prefixed `NEXT_PUBLIC_`.

## Deploying (manual)

1. Confirm the new image landed on DockerHub: `<DOCKER_USERNAME>/req-tool-fe:<commit-sha>` and `:latest`.
2. Open the Dokploy dashboard → the `req-tool-fe` Compose app.
3. If `docker/docker-compose.prod.yml` pins `IMAGE_TAG`, update it to the new commit SHA (recommended over relying on `latest` — see rollback below).
4. Click **Deploy** in the Dokploy UI.
5. Watch the deployment logs until the container reports healthy (`HEALTHCHECK` hits `/`).

## Rollback

The compose file resolves the image as `${DOCKER_USERNAME}/req-tool-fe:${IMAGE_TAG:-latest}`. To roll back:

1. In Dokploy, set the `IMAGE_TAG` environment variable for this app to the previous known-good commit SHA.
2. Click **Deploy** again — Dokploy will pull that exact tag instead of `latest`.

Never roll back by just redeploying `latest` — by the time you need to roll back, `latest` already points past the bad version.

## Production env vars (Dokploy app)

Set these as environment variables on the Dokploy app (consumed by `docker/docker-compose.prod.yml`):

- `DOCKER_USERNAME`
- `IMAGE_TAG` (optional, defaults to `latest`)
- `REQ_TOOL_FE_MEM_LIMIT` (optional, defaults to `512m`)
- Any server-side env vars the app reads at runtime (the `NEXT_PUBLIC_*` ones are already baked into the image at build time and don't need to be repeated here)
