# Docker / CI/CD — req-tool-fe

Flow: push to `main` → GitHub Actions validates (lint + build) → builds & pushes Docker image to DockerHub (tags: `latest` + commit SHA) → **deploy is manual**.

There is no auto-deploy step in this pipeline. After a successful push, a human deploys via the Dokploy dashboard when ready.

## Local development

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

Requires a `.env` file at the repo root with at least:

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_COOKIE_DOMAIN=
NEXT_PUBLIC_POST_LOGIN_PATH=
NEXT_PUBLIC_SEO_SUBJECTS_PATH=
```

## GitHub Secrets required

| Secret | Used for |
|---|---|
| `DOCKER_USERNAME` | DockerHub login + image namespace |
| `DOCKER_PASSWORD` | DockerHub access token (not account password) |
| `NEXT_PUBLIC_API_URL` | Inlined into the build (Next.js `NEXT_PUBLIC_*` vars are baked in at build time) |
| `NEXT_PUBLIC_APP_URL` | Same as above |
| `NEXT_PUBLIC_COOKIE_DOMAIN` | Same as above |
| `NEXT_PUBLIC_POST_LOGIN_PATH` | Same as above |
| `NEXT_PUBLIC_SEO_SUBJECTS_PATH` | Same as above |

No `DOKPLOY_*` secrets are needed — this pipeline does not call the Dokploy API.

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
