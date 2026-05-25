"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  logout,
  selectAuth,
  selectUser,
} from "@/lib/redux/slices/authSlice";

/**
 * Auth hook: đăng nhập qua **GitHub OAuth** (`useGithubOAuth`, `useGithubOAuthPopupResult` trong layout `(auth)`).
 * `logout` xóa session client + `queryClient.clear()`, chuyển về `/login`.
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const auth = useAppSelector(selectAuth);
  const user = useAppSelector(selectUser);

  const roles = user?.role ?? [];

  const logoutMutation = useMutation({
    mutationFn: async () => {
      dispatch(logout());
    },
    onSuccess: () => {
      void queryClient.clear();
      toast.success("Logged out successfully");
      router.push("/login");
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Failed to logout")
      );
    },
  });

  return {
    ...auth,
    user,
    roles,
    queryClient,
    logout: (options?: Parameters<typeof logoutMutation.mutateAsync>[1]) =>
      logoutMutation.mutateAsync(undefined, options),
    isLoggingOut: logoutMutation.isPending,
    logoutError: logoutMutation.error,
    resetLogoutError: logoutMutation.reset,
  };
}
