"use client";

import { useState } from "react";
import { CircleSlash, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OUT_OF_SCOPE_CATEGORIES } from "@/lib/api/services/fetchOutOfScope";
import type { OutOfScopeCategory } from "@/lib/api/services/fetchOutOfScope";
import { cn } from "@/lib/utils";

import { OUT_OF_SCOPE_CATEGORY_LABELS } from "./outOfScopeFormFields";
import { OutOfScopeFormDialog } from "./outOfScopeFormDialog";

export type OutOfScopeCategoryFilter = OutOfScopeCategory | "all";

function categoryFilterLabel(value: OutOfScopeCategoryFilter): string {
  if (value === "all") return "All categories";
  return OUT_OF_SCOPE_CATEGORY_LABELS[value];
}

type OutOfScopeToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: OutOfScopeCategoryFilter;
  onCategoryFilterChange: (value: OutOfScopeCategoryFilter) => void;
  projectId: string | null;
  canCreate?: boolean;
  className?: string;
};

export function OutOfScopeToolbar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  projectId,
  canCreate = true,
  className,
}: OutOfScopeToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const createDisabled = !canCreate || !projectId;

  return (
    <>
      <header className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-primary">
              <CircleSlash className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Out Of Scope
              </h1>
              <p className="text-sm text-pretty text-muted-foreground">
                Clearly define what falls outside the project scope to prevent scope creep
                scope creep
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
            Add
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
              placeholder="Search by description or category…"
              autoComplete="off"
              aria-label="Search out-of-scope items"
              className="h-10 w-full border-border/80 bg-muted/40 pr-3 pl-10 text-sm shadow-none"
            />
          </div>

          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              onCategoryFilterChange(value as OutOfScopeCategoryFilter)
            }
          >
            <SelectTrigger
              className="h-10 w-full shrink-0 border-border/80 bg-muted/40 sm:w-52"
              aria-label="Filter by category"
            >
              <SelectValue>{categoryFilterLabel(categoryFilter)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="All categories">
                All categories
              </SelectItem>
              {OUT_OF_SCOPE_CATEGORIES.map((cat) => (
                <SelectItem
                  key={cat}
                  value={cat}
                  label={OUT_OF_SCOPE_CATEGORY_LABELS[cat]}
                >
                  {OUT_OF_SCOPE_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <OutOfScopeFormDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        disabled={createDisabled}
      />
    </>
  );
}
