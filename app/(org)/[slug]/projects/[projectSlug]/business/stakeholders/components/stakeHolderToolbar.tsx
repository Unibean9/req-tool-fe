"use client";

import { useState } from "react";
import {
  Briefcase,
  CircleDashed,
  Plus,
  Search,
  UserRound,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { StakeHolderFormDialog } from "./stakeHolderFormDialog";

/** Lọc theo `actor_type`: tất cả | none | business_actor | other_actor. */
export type StakeholderActorTypeFilter =
  | "all"
  | "none"
  | "business_actor"
  | "other_actor";

/** @deprecated Use StakeholderActorTypeFilter */
export type StakeholderBusinessActorFilter = StakeholderActorTypeFilter;

const FILTER_LABELS: Record<StakeholderActorTypeFilter, string> = {
  all: "All stakeholders",
  none: "None",
  business_actor: "Business actor",
  other_actor: "Other actor",
};

type StakeHolderToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  businessActorFilter: StakeholderActorTypeFilter;
  onBusinessActorFilterChange: (value: StakeholderActorTypeFilter) => void;
  projectId: string | null;
  canCreate?: boolean;
  className?: string;
};

export function StakeHolderToolbar({
  search,
  onSearchChange,
  businessActorFilter,
  onBusinessActorFilterChange,
  projectId,
  canCreate = true,
  className,
}: StakeHolderToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false);

  const createDisabled = !canCreate || !projectId;

  return (
    <>
      <header className={cn("flex flex-col gap-4", className)}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-primary">
              <UsersRound className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Stakeholders
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Stakeholders and their influence levels in the project
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Actor type icon legend */}
            <div
              className="hidden items-center gap-3 sm:flex"
              aria-label="Actor type legend"
            >
              <span className="flex items-center gap-1.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-brand-mint/25 ring-1 ring-brand-mint/35 text-foreground">
                  <Briefcase className="size-3" aria-hidden />
                </span>
                <span className="text-[11px] text-muted-foreground">Business actor</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-amber-500/15 ring-1 ring-amber-500/30 text-amber-700 dark:text-amber-200">
                  <UserRound className="size-3" aria-hidden />
                </span>
                <span className="text-[11px] text-muted-foreground">Other actor</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-muted/65 ring-1 ring-border/70 text-muted-foreground">
                  <CircleDashed className="size-3" aria-hidden />
                </span>
                <span className="text-[11px] text-muted-foreground">None</span>
              </span>
            </div>

            <span className="hidden h-5 w-px shrink-0 rounded-full bg-border/60 sm:block" aria-hidden />

            <Button
              type="button"
              size="default"
              className="h-10 shrink-0 font-semibold"
              disabled={createDisabled}
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-row flex-wrap items-center gap-3">
          <div className="relative min-h-10 min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name, role, area…"
              autoComplete="off"
              aria-label="Search stakeholders"
              className="h-10 w-full border-border/80 bg-muted/40 pr-3 pl-10 text-sm shadow-none"
            />
          </div>

          <div className="relative h-10 w-full shrink-0 sm:w-56">
            <UserRoundCheck
              className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Select
              value={businessActorFilter}
              onValueChange={(value) => {
                if (value != null) {
                  onBusinessActorFilterChange(value as StakeholderActorTypeFilter);
                }
              }}
            >
              <SelectTrigger
                className="h-10 w-full border-border/80 bg-muted/40 pl-10"
                aria-label="Filter by model role"
              >
                <SelectValue>
                  {FILTER_LABELS[businessActorFilter]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label={FILTER_LABELS.all}>
                  {FILTER_LABELS.all}
                </SelectItem>
                <SelectItem value="none" label={FILTER_LABELS.none}>
                  {FILTER_LABELS.none}
                </SelectItem>
                <SelectItem value="business_actor" label={FILTER_LABELS.business_actor}>
                  {FILTER_LABELS.business_actor}
                </SelectItem>
                <SelectItem value="other_actor" label={FILTER_LABELS.other_actor}>
                  {FILTER_LABELS.other_actor}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </header>

      <StakeHolderFormDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        disabled={createDisabled}
      />
    </>
  );
}
