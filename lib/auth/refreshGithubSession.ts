import axios from "axios";
import { setCookie, deleteCookie } from "cookies-next";

import apiService from "@/lib/api/core";
import { getAuthCookieConfig } from "@/utils/cookieConfig";

import { AUTH_COOKIE } from "./session";

export const GITHUB_REFRESH_API_PATH = "/api/v1/auth/github/refresh" as const;

export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
};

interface GithubRefreshApiData {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

interface GithubRefreshApiResponse {
  success: boolean;
  data: GithubRefreshApiData;
  message: string | null;
}

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000/";
  return raw.replace(/\/+$/, "");
}

export function isGithubRefreshRequestUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes(GITHUB_REFRESH_API_PATH);
}

/** POST /api/v1/auth/github/refresh */
export async function refreshGithubTokens(
  refreshToken: string
): Promise<RefreshedTokens> {
  const response = await axios.post<GithubRefreshApiResponse>(
    `${getApiBaseUrl()}${GITHUB_REFRESH_API_PATH}`,
    { refresh_token: refreshToken },
    { headers: { "Content-Type": "application/json" } }
  );

  const body = response.data;
  const access = body?.data?.access_token;
  const refresh = body?.data?.refresh_token;

  if (!body?.success || typeof access !== "string" || !access || typeof refresh !== "string" || !refresh) {
    throw new Error(
      typeof body?.message === "string" && body.message.trim()
        ? body.message.trim()
        : "Could not refresh the login session."
    );
  }

  return { accessToken: access, refreshToken: refresh };
}

/** Chỉ ghi access token vào cookie (refresh_token chỉ trong Redux, dùng khi gọi refresh). */
export function persistAccessTokenCookie(accessToken: string): void {
  setCookie(AUTH_COOKIE, accessToken, getAuthCookieConfig());
  apiService.setAuthToken(accessToken);
}

export function clearAuthTokenCookies(): void {
  const config = getAuthCookieConfig();
  deleteCookie(AUTH_COOKIE, { path: config.path, domain: config.domain });
}
