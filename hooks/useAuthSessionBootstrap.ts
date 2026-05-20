"use client";

import { getCookie } from "cookies-next";
import { useEffect, useRef } from "react";

import { persistAccessTokenCookie } from "@/lib/auth/refreshGithubSession";
import {
  AUTH_COOKIE,
  buildLoginUrl,
  isAuthTokenExpired,
} from "@/lib/auth/session";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  refreshTokenAsync,
  setupAutoRefresh,
  selectAuth,
} from "@/lib/redux/slices/authSlice";
import type { AppDispatch } from "@/lib/redux/store";

/**
 * Sau rehydrate: refresh nếu JWT trong cookie/Redux hết hạn nhưng còn refresh token.
 * Tránh logout oan khi cookie maxAge 7 ngày nhưng access JWT ngắn hơn.
 */
export function useAuthSessionBootstrap() {
  const dispatch = useAppDispatch();
  const { token, refreshToken } = useAppSelector(selectAuth);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      if (!refreshToken) return;

      const cookieRaw = getCookie(AUTH_COOKIE);
      const cookieToken =
        typeof cookieRaw === "string" && cookieRaw.length > 0
          ? cookieRaw
          : undefined;

      const accessExpired = !token || isAuthTokenExpired(token);
      const cookieExpired =
        !cookieToken || isAuthTokenExpired(cookieToken);

      if (accessExpired || cookieExpired) {
        const result = await dispatch(refreshTokenAsync());
        if (
          refreshTokenAsync.rejected.match(result) &&
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/login")
        ) {
          window.location.replace(buildLoginUrl(window.location.pathname));
        }
        return;
      }

      if (token) {
        if (cookieToken !== token) {
          persistAccessTokenCookie(token);
        }
        setupAutoRefresh(token, dispatch as AppDispatch);
      }
    })();
  }, [dispatch, refreshToken, token]);
}
