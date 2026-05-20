/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { jwtDecode } from "jwt-decode";
import apiService from "@/lib/api/core";
import {
  clearAuthTokenCookies,
  persistAccessTokenCookie,
  refreshGithubTokens,
} from "@/lib/auth/refreshGithubSession";
import type { RootState, AppDispatch } from "../store";

export interface User {
  id: string;
  email: string;
  userNname: string;

  role: string[];
}

export interface DecodedToken extends User {
  nbf?: number;
  exp?: number;
  iat?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const decodeToken = (token: string): User | null => {
  try {
    const decoded: any = jwtDecode(token);
    if (decoded.role && !Array.isArray(decoded.role)) {
      decoded.role = [decoded.role];
    }
    if (!decoded.id && typeof decoded.sub === "string") {
      decoded.id = decoded.sub;
    }
    return decoded as User;
  } catch {
    return null;
  }
};

export const decodeTokenWithExpiry = (token: string): DecodedToken | null => {
  try {
    const decoded: any = jwtDecode(token);
    if (decoded.role && !Array.isArray(decoded.role)) {
      decoded.role = [decoded.role];
    }
    if (!decoded.id && typeof decoded.sub === "string") {
      decoded.id = decoded.sub;
    }
    return decoded as DecodedToken;
  } catch {
    return null;
  }
};

export const setupAutoRefresh = (token: string, dispatch: AppDispatch) => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const decoded = decodeTokenWithExpiry(token);
  if (!decoded?.exp) return;

  const refreshTime = decoded.exp * 1000 - Date.now() - 2 * 60 * 1000;

  if (refreshTime <= 0) {
    dispatch(refreshTokenAsync());
    return;
  }

  refreshTimer = setTimeout(() => dispatch(refreshTokenAsync()), refreshTime);
};

export const clearAutoRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
};

function clearAuthClientSession() {
  clearAuthTokenCookies();
  apiService.setAuthToken(null);
  clearAutoRefresh();
}

function resetAuthStateFields(state: AuthState) {
  state.user = null;
  state.token = null;
  state.refreshToken = null;
  state.isAuthenticated = false;
  state.isLoading = false;
  state.error = null;
}

export const refreshTokenAsync = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState() as RootState;
      const { refreshToken } = state.auth;
      if (!refreshToken) return rejectWithValue("No refresh token");

      const tokens = await refreshGithubTokens(refreshToken);
      persistAccessTokenCookie(tokens.accessToken);
      dispatch(
        setTokenWithRefresh({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
      setupAutoRefresh(tokens.accessToken, dispatch as AppDispatch);
      const user = decodeToken(tokens.accessToken);

      return {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Refresh failed";
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokenWithRefresh: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      apiService.setAuthToken(action.payload.accessToken);
      const user = decodeToken(action.payload.accessToken);
      if (user) {
        state.user = user;
        state.isAuthenticated = true;
      }
    },
    logout: (state) => {
      resetAuthStateFields(state);
      clearAuthClientSession();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshTokenAsync.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
      })
      .addCase(refreshTokenAsync.rejected, (state) => {
        resetAuthStateFields(state);
        clearAuthClientSession();
      });
  },
});

export const { setTokenWithRefresh, logout, clearError } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthToken = (state: RootState) => state.auth.token;

export default authSlice.reducer;
