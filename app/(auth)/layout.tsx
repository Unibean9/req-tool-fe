"use client";

import { GitBranch, Target, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { SafeImage } from "@/components/ui/safe-image";
import { useGithubOAuthPopupResult } from "@/hooks/useGithub";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

function safeFromSearchParam(raw: string | null): string | undefined {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return undefined;
  return raw;
}

function AuthGithubOAuthListener() {
  const searchParams = useSearchParams();
  const from = safeFromSearchParam(searchParams.get("from"));
  useGithubOAuthPopupResult(from);
  return null;
}

function AuthBrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-4",
        className
      )}
    >
      <span
        className={cn(
          "relative flex size-18 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card/80 p-2.5 shadow-sm",
          "sm:size-20"
        )}
      >
        <span className="relative size-full">
          <SafeImage
            src="/Logo.png"
            alt="Requirements | Bean9"
            fill
            priority
            sizes="110px"
            className="object-contain"
          />
        </span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-xl font-semibold leading-none tracking-tight text-foreground sm:text-2xl">
          Requirements | Bean9
        </span>
        <span className="mt-1 text-[11px] font-semibold tracking-[0.16em] text-brand-mint uppercase">
          Requirements workspace
        </span>
      </span>
    </div>
  );
}

const features = [
  {
    icon: GitBranch,
    tone: "jade" as const,
    title: "Actor → Story",
    body: "Epic đến Acceptance Criteria.",
  },
  {
    icon: Users,
    tone: "blue" as const,
    title: "Workspace",
    body: "Phân quyền theo thành viên.",
  },
  {
    icon: Target,
    tone: "violet" as const,
    title: "Goals & NFR",
    body: "Mục tiêu và luồng nghiệp vụ.",
  },
] as const;

const featureIconToneClass = {
  jade: "bg-brand-jade/20 text-brand-mint",
  blue: "bg-sky-500/20 text-sky-300",
  violet: "bg-violet-500/20 text-violet-300",
} as const;

const studentAvatars = [
  { initials: "TL", className: "bg-emerald-700" },
  { initials: "MH", className: "bg-sky-700" },
  { initials: "NA", className: "bg-violet-700" },
  { initials: "BT", className: "bg-amber-800" },
] as const;

function AuthMarketingAside() {
  return (
    <div className="relative z-10 flex h-full min-h-0 w-full flex-col gap-5 overflow-hidden px-6 py-8 lg:gap-6 lg:px-10 lg:py-10 xl:px-12 2xl:px-14">
      <header className="w-full shrink-0">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-brand-mint">
          Công cụ yêu cầu
        </p>
        <h2 className="mt-2 max-w-2xl text-pretty font-heading text-xl font-semibold leading-snug tracking-tight text-foreground lg:text-[1.5rem] lg:leading-tight xl:text-[1.625rem]">
          Một nơi cho toàn bộ nội dung{" "}
          <span className="text-brand-mint">kỹ thuật</span> dự án.
        </h2>
      </header>

      <div className="relative flex min-h-0 w-full flex-1 flex-col gap-5">
        <div className="relative flex min-h-0 w-full flex-1 items-center justify-center">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_50%_45%,color-mix(in_oklab,var(--brand-jade)_18%,transparent),transparent_72%)]"
            aria-hidden
          />
          <div className="relative h-full min-h-[min(38vh,20rem)] w-full xl:min-h-[min(44vh,24rem)]">
            <SafeImage
              src="/auth-image.png"
              alt="Minh họa làm việc với Requirements | Bean9"
              fill
              priority
              sizes="(max-width: 1024px) 50vw, 640px"
              className="object-contain object-center xl:scale-50 2xl:scale-70"
            />
          </div>
        </div>

        <ul className="grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-3" role="list">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="rounded-lg border border-border/40 bg-card/30 px-3 py-2.5 backdrop-blur-sm"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md",
                      featureIconToneClass[feature.tone]
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={2} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-tight text-foreground">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {feature.body}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border/30 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0" aria-hidden>
            {studentAvatars.map((avatar) => (
              <span
                key={avatar.initials}
                className={cn(
                  "-ml-1.5 flex size-7 items-center justify-center rounded-full border-2 border-background/80 text-[9px] font-bold text-foreground first:ml-0",
                  avatar.className
                )}
              >
                {avatar.initials}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Đang được dùng bởi các nhóm sinh viên
          </p>
        </div>
        <div className="flex gap-2" aria-hidden>
          {["Epic", "Actor", "Goals"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-brand-jade/25 bg-brand-jade/10 px-2 py-0.5 text-[10px] font-medium text-brand-mint"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuthLegalFooter() {
  return (
    <p className="max-w-sm text-[11px] leading-relaxed text-muted-foreground">
      Bằng cách đăng nhập, bạn đồng ý với{" "}
      <span className="font-semibold text-foreground">Điều khoản dịch vụ</span> và{" "}
      <span className="font-semibold text-foreground">Chính sách bảo mật</span>.
    </p>
  );
}

export default function AuthRouteGroupLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="relative isolate h-dvh w-full overflow-hidden bg-background">
      <div className="relative z-10 flex h-full w-full flex-col md:flex-row">
        <main className="flex h-full min-h-0 flex-1 flex-col bg-[color-mix(in_oklab,var(--card)_88%,var(--background))] md:w-[46%] md:max-w-none lg:w-[44%] xl:w-[42%]">
          <div className="mx-auto flex h-full w-full max-w-lg min-h-0 flex-col px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
            <AuthBrandMark className="shrink-0" />

            <div className="flex min-h-0 flex-1 flex-col justify-center py-8">
              <Suspense
                fallback={
                  <p className="text-sm text-muted-foreground" role="status">
                    Đang tải…
                  </p>
                }
              >
                <AuthGithubOAuthListener />
                {children}
              </Suspense>
            </div>

            <footer className="shrink-0 pt-4">
              <AuthLegalFooter />
            </footer>
          </div>
        </main>

        {!isMobile ? (
          <aside className="relative hidden h-full min-h-0 min-w-0 flex-1 bg-[color-mix(in_oklab,var(--brand-dark)_35%,#0a0a0a)] md:flex md:w-[54%] lg:w-[56%] xl:w-[58%]">
            <div
              className="pointer-events-none absolute -top-20 -right-16 size-[17.5rem] rounded-full bg-brand-jade/20 blur-[80px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-10 left-[20%] size-[13.75rem] rounded-full bg-sky-500/15 blur-[80px]"
              aria-hidden
            />
            <AuthMarketingAside />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
