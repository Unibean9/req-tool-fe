"use client";

import { useState } from "react";
import { Plus, Search, UserRoundCheck, UsersRound } from "lucide-react";

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

/** Lọc API `is_business_actor`: tất cả | chỉ business actor | không phải business actor. */
export type StakeholderBusinessActorFilter = "all" | "business" | "non_business";

function businessActorFilterLabel(value: StakeholderBusinessActorFilter): string {
  if (value === "all") return "Tất cả stakeholders";
  if (value === "business") return "Chỉ business actor";
  return "Không phải business actor";
}

type StakeHolderToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  businessActorFilter: StakeholderBusinessActorFilter;
  onBusinessActorFilterChange: (value: StakeholderBusinessActorFilter) => void;
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
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-primary">
              <UsersRound className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Stakeholders
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Bên liên quan và mức ảnh hưởng trong dự án
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="default"
            className="h-10 shrink-0 font-semibold"
            disabled={createDisabled}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-4" aria-hidden />
            Thêm stakeholder
          </Button>
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
              placeholder="Tìm theo tên, vai trò, lĩnh vực…"
              autoComplete="off"
              aria-label="Tìm stakeholder"
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
              onValueChange={(value) =>
                onBusinessActorFilterChange(value as StakeholderBusinessActorFilter)
              }
            >
              <SelectTrigger
                className="h-10 w-full border-border/80 bg-muted/40 pl-10"
                aria-label="Lọc theo business actor"
              >
                <SelectValue>
                  {businessActorFilterLabel(businessActorFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label={businessActorFilterLabel("all")}>
                  {businessActorFilterLabel("all")}
                </SelectItem>
                <SelectItem value="business" label={businessActorFilterLabel("business")}>
                  {businessActorFilterLabel("business")}
                </SelectItem>
                <SelectItem
                  value="non_business"
                  label={businessActorFilterLabel("non_business")}
                >
                  {businessActorFilterLabel("non_business")}
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
