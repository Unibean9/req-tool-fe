import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  AUTH_COOKIE,
  isAuthTokenExpired,
  safeRedirectPath,
} from "@/lib/auth/session";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  return false;
}

function redirectToLogin(
  request: NextRequest,
  fromPathname: string,
  clearAuthCookie: boolean
) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  const from = safeRedirectPath(fromPathname);
  if (from !== "/" && from !== "/login") {
    url.searchParams.set("from", from);
  }
  const res = NextResponse.redirect(url);
  if (clearAuthCookie) {
    res.cookies.delete(AUTH_COOKIE);
  }
  return res;
}

/** Next.js 16+: `proxy` thay cho `middleware` (cùng Edge boundary, cookie redirect). */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value ?? "";
  const hasToken = token.length > 0;
  const tokenValid = hasToken && !isAuthTokenExpired(token);

  /**
   * Cookie maxAge (7 ngày) ≠ thời hạn JWT. JWT hết hạn vẫn cho vào app — client
   * `useAuthSessionBootstrap` refresh bằng refresh token (localStorage) rồi ghi cookie mới.
   */
  if (!hasToken && !isPublicPath(pathname)) {
    return redirectToLogin(request, pathname, false);
  }

  if (tokenValid && pathname === "/login") {
    const from = safeRedirectPath(request.nextUrl.searchParams.get("from"));
    const url = request.nextUrl.clone();
    url.pathname = from;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
