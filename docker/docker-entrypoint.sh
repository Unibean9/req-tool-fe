#!/bin/sh
# Next.js bakes NEXT_PUBLIC_* into the client bundle at build time. To allow
# changing these via runtime env (Dokploy/.env) without rebuilding the image,
# the build uses fixed placeholder tokens which we substitute here on startup.
set -e

replace_placeholder() {
  placeholder="$1"
  value="$2"
  [ -z "$value" ] && return 0
  grep -rIl "$placeholder" /app/.next /app/public 2>/dev/null | while IFS= read -r file; do
    sed -i "s|$placeholder|$value|g" "$file"
  done
}

replace_placeholder "__RUNTIME_NEXT_PUBLIC_API_URL__" "$NEXT_PUBLIC_API_URL"
replace_placeholder "__RUNTIME_NEXT_PUBLIC_COOKIE_DOMAIN__" "$NEXT_PUBLIC_COOKIE_DOMAIN"
replace_placeholder "__RUNTIME_NEXT_PUBLIC_ENV__" "$NEXT_PUBLIC_ENV"
replace_placeholder "__RUNTIME_NEXT_PUBLIC_POST_LOGIN_PATH__" "$NEXT_PUBLIC_POST_LOGIN_PATH"
replace_placeholder "__RUNTIME_NEXT_PUBLIC_SEO_SUBJECTS_PATH__" "$NEXT_PUBLIC_SEO_SUBJECTS_PATH"

exec "$@"
