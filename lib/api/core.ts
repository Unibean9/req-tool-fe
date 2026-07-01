/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { deleteCookie } from "cookies-next";

import {
  isGithubRefreshRequestUrl,
  refreshGithubTokens,
  persistAccessTokenCookie,
  clearAuthTokenCookies,
} from "@/lib/auth/refreshGithubSession";
import { buildLoginUrl } from "@/lib/auth/session";
import { formatMessageFromValidationBody } from "@/lib/api/getApiErrorMessage";

let store: any;
export const injectStore = (_store: any) => {
  store = _store;
};

export interface ApiError {
  code?: number;
  message: string;
  status: boolean;
  data?: unknown;
}

class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(baseURL: string, timeout = 600000) {
    this.client = axios.create({
      baseURL,
      timeout,
      headers: { "Content-Type": "application/json" },
    });
    this.setupInterceptors();
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) prom.reject(error);
      else prom.resolve(token!);
    });
    this.failedQueue = [];
  }

  private sessionEndedRedirecting = false;

  private async endSessionAndRedirectToLogin(): Promise<void> {
    if (typeof window === "undefined" || this.sessionEndedRedirecting) return;
    this.sessionEndedRedirecting = true;

    if (store) {
      const { logout } = await import("@/lib/redux/slices/authSlice");
      store.dispatch(logout());
    } else {
      clearAuthTokenCookies();
    }

    window.dispatchEvent(new Event("logout"));

    const loginUrl = buildLoginUrl(window.location.pathname);
    window.location.replace(loginUrl);
  }

  private isRefreshTokenRequest(config: AxiosRequestConfig | undefined): boolean {
    return isGithubRefreshRequestUrl(config?.url);
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = store?.getState()?.auth?.token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
        if (config.data instanceof FormData) delete config.headers["Content-Type"];
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401) {
          const refreshToken = store?.getState()?.auth?.refreshToken;
          const shouldRefresh =
            !originalRequest._retry &&
            !this.isRefreshTokenRequest(originalRequest) &&
            Boolean(refreshToken);

          if (!shouldRefresh) {
            void this.endSessionAndRedirectToLogin();
            return Promise.reject({
              code: 401,
              message: "Đăng nhập hết hạn. Vui lòng đăng nhập lại.",
              status: false,
            } as ApiError);
          }

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers["Authorization"] = "Bearer " + token;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokens = await refreshGithubTokens(refreshToken);
            persistAccessTokenCookie(tokens.accessToken);

            const { setTokenWithRefresh, setupAutoRefresh } = await import(
              "@/lib/redux/slices/authSlice"
            );

            if (store) {
              store.dispatch(setTokenWithRefresh(tokens));
              setupAutoRefresh(tokens.accessToken, store.dispatch);
            }

            this.processQueue(null, tokens.accessToken);
            this.isRefreshing = false;

            originalRequest.headers["Authorization"] =
              "Bearer " + tokens.accessToken;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.isRefreshing = false;
            this.processQueue(refreshError, null);
            void this.endSessionAndRedirectToLogin();

            return Promise.reject({
              code: 401,
              message: "Đăng nhập hết hạn. Vui lòng đăng nhập lại.",
              status: false,
            } as ApiError);
          }
        }

        const rawData = error.response?.data;
        const validationMsg = formatMessageFromValidationBody(rawData);
        const dataMessage =
          rawData &&
          typeof rawData === "object" &&
          "message" in rawData &&
          typeof (rawData as { message: unknown }).message === "string"
            ? (rawData as { message: string }).message.trim()
            : "";

        const apiError: ApiError = {
          code: error.response?.status,
          message:
            validationMsg ||
            dataMessage ||
            error.message ||
            "Đã xảy ra lỗi",
          status: false,
          data: rawData,
        };

        return Promise.reject(apiError);
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common.Authorization;
    }
  }

  async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request<T>(config);
  }

  async get<T>(url: string, params?: Record<string, any>): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "GET", url, params });
  }

  async post<T, D = any>(url: string, data?: D): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "POST", url, data });
  }

  async put<T, D = any>(url: string, data?: D): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "PUT", url, data });
  }

  async patch<T, D = any>(url: string, data?: D): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "PATCH", url, data });
  }

  async delete<T>(url: string): Promise<AxiosResponse<T>> {
    return this.request<T>({ method: "DELETE", url });
  }

  async upload<T>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({
      method: "POST",
      url,
      data: formData,
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  }
}

const apiService = new ApiService(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/");

export default apiService;
