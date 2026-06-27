/**
 * GitHub OAuth **bắt đầu** từ backend — phải dùng **điều hướng trình duyệt**
 * (`window.open` / `location.assign`), không gọi axios/fetch: XHR không follow
 * redirect cross-origin như navigation, dễ dính CORS.
 */
export const GITHUB_OAUTH_API_PATH = "/api/v1/auth/github" as const;

function normalizeApiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000/";
  return raw.replace(/\/+$/, "");
}

export function getGithubOAuthUrl(): string {
  return `${normalizeApiOrigin()}${GITHUB_OAUTH_API_PATH}`;
}

export const fetchGithub = {
  oauthPath: GITHUB_OAUTH_API_PATH,
  getOAuthUrl: getGithubOAuthUrl,
};
