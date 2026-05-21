"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  LayoutGrid,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrg } from "@/hooks/useOrg";
import type { Org } from "@/lib/api/services/fetchOrg";
import {
  fetchProject,
  type OrgProjectsListResponse,
} from "@/lib/api/services/fetchProject";
import { orgProjectsQueryKey } from "@/lib/query/query-keys";

import { startNavigationProgress } from "@/components/ui/navigation-progress";
import { DEFAULT_QUERY_STALE_MS } from "@/lib/query/defaults";

import { buildOrgEntryPath } from "./orgWorkspacePaths";
import { cn } from "@/lib/utils";

const ORG_CARD_TONES = [
  "from-orange-400 to-rose-600",
  "from-violet-500 to-indigo-700",
  "from-cyan-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-fuchsia-500 to-pink-600",
  "from-emerald-400 to-green-700",
  "from-sky-400 to-blue-700",
] as const;

const listStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
} as const;

const cardReveal = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

function orgCardToneFromSeed(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ORG_CARD_TONES[h % ORG_CARD_TONES.length]!;
}

function formatOrgCreatedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function orgInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0).toLocaleUpperCase("vi-VN");
}

type OrgHomeListProps = {
  orgs: Org[];
};

function OrgHomeOrgCard({ org }: { org: Org }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpening, setIsOpening] = useState(false);
  const projectsQueryKey = orgProjectsQueryKey(org.id);

  const prefetchProjects = useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey: projectsQueryKey,
      queryFn: () => fetchProject.listOrgProjects(org.id),
      staleTime: DEFAULT_QUERY_STALE_MS,
    });
  }, [org.id, projectsQueryKey, queryClient]);

  const openOrg = useCallback(async () => {
    if (isOpening) return;
    setIsOpening(true);
    startNavigationProgress();

    try {
      let projects =
        queryClient.getQueryData<OrgProjectsListResponse>(projectsQueryKey)
          ?.data;

      if (!projects) {
        const res = await queryClient.fetchQuery({
          queryKey: projectsQueryKey,
          queryFn: () => fetchProject.listOrgProjects(org.id),
        });
        projects = res.data;
      }

      router.push(buildOrgEntryPath(org.slug, projects));
    } catch {
      router.push(`/${encodeURIComponent(org.slug)}/projects`);
    }
  }, [isOpening, org.id, org.slug, projectsQueryKey, queryClient, router]);

  return (
    <button
      type="button"
      data-navigation-progress
      disabled={isOpening}
      onPointerEnter={prefetchProjects}
      onFocus={prefetchProjects}
      onClick={() => void openOrg()}
      className={cn(
        "group/card block h-full w-full rounded-2xl text-left outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-70"
      )}
    >
      <article
        className={cn(
          "relative flex h-full min-h-52 flex-col overflow-hidden rounded-2xl",
          "border border-border/60 bg-card/55 shadow-sm ring-1 ring-white/[0.03]",
          "transition-[border-color,box-shadow,transform,background-color] duration-200 ease-out",
          "group-hover/card:-translate-y-0.5 group-hover/card:border-brand-jade/35 group-hover/card:bg-card/75 group-hover/card:shadow-lg group-hover/card:shadow-black/10"
        )}
      >
        <div
          className="pointer-events-none absolute -top-24 right-0 size-44 rounded-full bg-brand-jade/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover/card:opacity-100"
          aria-hidden
        />

        <div className="flex flex-1 flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <span
              className={cn(
                "flex size-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-base font-bold text-white shadow-sm ring-1 ring-white/15",
                orgCardToneFromSeed(org.id)
              )}
              aria-hidden
            >
              {orgInitial(org.name)}
            </span>
            <span className="rounded-full border border-border/50 bg-muted/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Org
            </span>
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="font-heading line-clamp-2 text-xl font-semibold leading-snug tracking-tight text-foreground">
              {org.name}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-4 shrink-0 opacity-75" aria-hidden />
              <time dateTime={org.createdAt}>{formatOrgCreatedAt(org.createdAt)}</time>
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/45 pt-4">
            <span className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <LayoutGrid className="size-3.5 shrink-0" aria-hidden />
              Workspace
            </span>
            <span className="inline-flex min-w-28 items-center justify-end gap-1 text-xs font-semibold text-brand-mint transition-[gap] duration-200 group-hover/card:gap-1.5">
              {isOpening ? "Đang mở…" : "Mở workspace"}
              <ArrowRight
                className={cn(
                  "size-3.5 shrink-0 transition-transform duration-200",
                  !isOpening && "group-hover/card:translate-x-0.5"
                )}
                aria-hidden
              />
            </span>
          </div>
        </div>
      </article>
    </button>
  );
}

function CreateOrgCard({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group/create flex h-full min-h-52 w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/[0.08] px-4 py-8 text-center outline-none",
        "transition-[border-color,background-color,transform,box-shadow] duration-200",
        "hover:-translate-y-0.5 hover:border-brand-jade/45 hover:bg-brand-jade/[0.06] hover:shadow-lg hover:shadow-black/10",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-background/45 text-muted-foreground transition-colors group-hover/create:border-brand-jade/30 group-hover/create:bg-brand-jade/10 group-hover/create:text-brand-mint">
        <Plus className="size-5" aria-hidden />
      </span>
      <span className="font-heading text-base font-semibold tracking-tight text-muted-foreground transition-colors group-hover/create:text-foreground">
        Tạo tổ chức mới
      </span>
    </button>
  );
}

export function OrgHomeList({ orgs }: OrgHomeListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const trimmedNew = newOrgName.trim();

  const { mutateAsync: createOrg, isPending: isCreating } = useCreateOrg({
    onSuccess: (res) => {
      setCreateOpen(false);
      setNewOrgName("");
      startNavigationProgress();
      router.push(`/${encodeURIComponent(res.data.slug)}/projects`);
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orgs;
    return orgs.filter((o) => o.name.toLowerCase().includes(q));
  }, [orgs, search]);

  const joinedCount = orgs.length;
  const listCount = filtered.length;

  return (
    <div className="flex min-h-full w-full flex-1 flex-col gap-7 px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      <header className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/35 p-5 shadow-sm ring-1 ring-white/[0.03] sm:p-7">
        <div
          className="pointer-events-none absolute -top-28 left-1/2 size-72 -translate-x-1/2 rounded-full bg-brand-jade/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-mint">
              Workspace
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Tổ chức của bạn
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Chọn nơi làm việc để tiếp tục với dự án, thành viên và mô hình yêu cầu.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:min-w-[30rem]">
            {orgs.length > 0 ? (
              <div className="relative min-h-11 flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm tổ chức..."
                  autoComplete="off"
                  aria-label="Tìm tổ chức"
                  className="h-11 rounded-2xl border-border/70 bg-background/45 pl-10 shadow-none ring-1 ring-white/[0.03] focus-visible:ring-brand-jade/30"
                />
              </div>
            ) : null}
            <Button
              type="button"
              size="lg"
              className="h-11 shrink-0 gap-2 rounded-2xl px-5 font-semibold shadow-none"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
              Tạo tổ chức
            </Button>
          </div>
        </div>
      </header>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setNewOrgName("");
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Tạo tổ chức mới</DialogTitle>
            <DialogDescription>
              Nhập tên tổ chức. Sau khi tạo xong bạn sẽ được chuyển vào workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 px-1">
            <Label htmlFor="dialog-org-name" className="text-sm font-semibold">
              Tên tổ chức
            </Label>
            <div className="relative">
              <Building2
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="dialog-org-name"
                autoComplete="organization"
                placeholder="Ví dụ: Team Platform"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                disabled={isCreating}
                className="h-11 rounded-xl border-border/80 bg-muted/25 pl-11"
              />
            </div>
          </div>
          <DialogFooter className="mt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={isCreating}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="font-semibold"
              disabled={!trimmedNew || isCreating}
              onClick={() => void createOrg({ name: trimmedNew })}
            >
              {isCreating ? "Đang tạo…" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {orgs.length > 0 ? (
        <section className="flex flex-col gap-5">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                Đã tham gia
              </h2>
              <p className="text-sm text-muted-foreground">
                Các workspace bạn có thể truy cập.
              </p>
            </div>
            <p className="rounded-full border border-border/55 bg-muted/20 px-3 py-1 text-sm tabular-nums text-muted-foreground">
              {listCount === joinedCount
                ? `${joinedCount} tổ chức`
                : `${listCount} / ${joinedCount}`}
            </p>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-border/55 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
              Không có tổ chức khớp với từ khóa &ldquo;{search.trim()}&rdquo;.
            </p>
          ) : null}

          <motion.ul
            className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
           
            variants={listStagger}
            initial="hidden"
            animate="show"
          >
            {filtered.map((org) => (
              <motion.li key={org.id} className="min-w-0" variants={cardReveal}>
                <OrgHomeOrgCard org={org} />
              </motion.li>
            ))}
            <motion.li className="min-w-0" variants={cardReveal}>
              <CreateOrgCard onClick={() => setCreateOpen(true)} />
            </motion.li>
          </motion.ul>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-7 rounded-3xl border border-border/55 bg-card/25 px-6 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-brand-jade/10 text-brand-mint">
            <Building2 className="size-7" aria-hidden />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Chưa có tổ chức nào
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tạo tổ chức đầu tiên để bắt đầu quản lý dự án và yêu cầu phần mềm.
            </p>
          </div>
          <CreateOrgCard
            onClick={() => setCreateOpen(true)}
            className="max-w-md sm:min-h-48"
          />
        </section>
      )}
    </div>
  );
}
