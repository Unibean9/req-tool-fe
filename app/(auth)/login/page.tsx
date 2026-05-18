"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useGithubOAuth } from "@/hooks/useGithub";
import { cn } from "@/lib/utils";

import { GitHubMark } from "./components/github-mark";
import { LoginCard } from "./components/login-card";

const githubCtaClass = cn(
  "h-12 w-full gap-2.5 rounded-lg text-sm font-semibold text-white shadow-none",
  "border border-white/15 bg-[#24292f]",
  "transition-[transform,background-color,border-color] duration-200 ease-out",
  "hover:-translate-y-px hover:border-white/25 hover:bg-[#2d333b]",
  "active:translate-y-px",
  "focus-visible:ring-2 focus-visible:ring-brand-mint/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "disabled:pointer-events-none disabled:opacity-55",
  "[&_svg]:text-white"
);

export default function LoginPage() {
  const { openOAuth } = useGithubOAuth();
  const [popupBusy, setPopupBusy] = React.useState(false);

  return (
    <LoginCard>
      <Button
        type="button"
        className={githubCtaClass}
        disabled={popupBusy}
        onClick={() => {
          setPopupBusy(true);
          const ok = openOAuth();
          if (!ok) {
            toast.error("Không mở được cửa sổ đăng nhập.", {
              description: "Cho phép popup cho site này rồi thử lại.",
            });
          }
          window.setTimeout(() => setPopupBusy(false), 800);
        }}
      >
        {popupBusy ? (
          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <GitHubMark className="size-[1.05rem] shrink-0" />
        )}
        {popupBusy ? "Đang mở…" : "Tiếp tục với GitHub"}
      </Button>
    </LoginCard>
  );
}
