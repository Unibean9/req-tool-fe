"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

const TRICKLE_MS = 120;
const COMPLETE_MS = 220;
const HIDE_MS = 280;

type NavigationProgressController = {
  start: () => void;
  complete: () => void;
};

let navigationProgressController: NavigationProgressController | null = null;

/** Gọi trước `router.push` / `replace` khi không dùng `<Link>`. */
export function startNavigationProgress() {
  navigationProgressController?.start();
}

export function completeNavigationProgress() {
  navigationProgressController?.complete();
}

type NavigationProgressProps = {
  className?: string;
  /** Màu thanh (mặc định gradient brand). */
  color?: string;
  height?: number;
  showShadow?: boolean;
  /** Bật khi pathname/search thay đổi mà không có click link trước (router.push). */
  pulseOnRouteChange?: boolean;
};

function isSameOriginNavigation(href: string): boolean {
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    const current = `${window.location.pathname}${window.location.search}`;
    const next = `${url.pathname}${url.search}`;
    return current !== next;
  } catch {
    return false;
  }
}

function NavigationProgressBar({
  className,
  color,
  height = 4,
  showShadow = true,
  pulseOnRouteChange = true,
}: NavigationProgressProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const loadingRef = useRef(false);
  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextRouteRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
    if (completeTimerRef.current) {
      clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimers();
    loadingRef.current = true;
    setVisible(true);
    setProgress((p) => (p > 0 && p < 1 ? p : 0.08));

    trickleRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 0.9) return p;
        const inc = (1 - p) * (0.02 + Math.random() * 0.06);
        return Math.min(0.9, p + inc);
      });
    }, TRICKLE_MS);
  }, [clearTimers]);

  const complete = useCallback(() => {
    if (!loadingRef.current) return;
    clearTimers();
    loadingRef.current = false;
    setProgress(1);

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      completeTimerRef.current = setTimeout(() => {
        setProgress(0);
      }, COMPLETE_MS);
    }, HIDE_MS);
  }, [clearTimers]);

  useEffect(() => {
    navigationProgressController = { start, complete };
    return () => {
      navigationProgressController = null;
    };
  }, [start, complete]);

  const pulse = useCallback(() => {
    start();
    completeTimerRef.current = setTimeout(() => complete(), 120);
  }, [start, complete]);

  useEffect(() => {
    if (skipNextRouteRef.current) {
      skipNextRouteRef.current = false;
      return;
    }

    const id = window.requestAnimationFrame(() => {
      if (loadingRef.current) {
        complete();
        return;
      }
      if (pulseOnRouteChange) {
        pulse();
      }
    });

    return () => window.cancelAnimationFrame(id);
  }, [routeKey, complete, pulse, pulseOnRouteChange]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (anchor) {
        if (anchor.target !== "_blank" && !anchor.hasAttribute("download")) {
          const href = anchor.getAttribute("href");
          if (href && isSameOriginNavigation(href)) {
            start();
          }
        }
        return;
      }

      const progressButton = target.closest<HTMLElement>(
        "[data-navigation-progress]"
      );
      if (progressButton && !progressButton.hasAttribute("disabled")) {
        start();
      }
    };

    const onPopState = () => {
      start();
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      clearTimers();
    };
  }, [start, clearTimers]);

  const barStyle: CSSProperties = {
    height,
    transform: `scaleX(${visible ? progress : 0})`,
    opacity: visible ? 1 : 0,
    ...(color
      ? { background: color }
      : {
          background:
            "linear-gradient(90deg, var(--brand-jade) 0%, var(--brand-mint) 55%, #d8f7e8 100%)",
          boxShadow:
            "0 0 12px color-mix(in oklab, var(--brand-mint) 70%, transparent), 0 1px 0 color-mix(in oklab, white 25%, transparent) inset",
        }),
  };

  return (
    <div
      role="progressbar"
      aria-hidden
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      data-slot="navigation-progress"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-9999 origin-left transition-[transform,opacity] duration-200 ease-out",
        showShadow &&
          "shadow-[0_2px_14px_color-mix(in_oklab,var(--brand-mint)_65%,transparent),0_0_24px_color-mix(in_oklab,var(--brand-jade)_35%,transparent)]",
        className
      )}
      style={barStyle}
    />
  );
}

/**
 * Thanh tiến trình cố định đầu trang khi điều hướng (Link, router, back/forward).
 * Gắn một lần trong layout/provider gốc.
 */
export function NavigationProgress(props: NavigationProgressProps) {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar {...props} />
    </Suspense>
  );
}
