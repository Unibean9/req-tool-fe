"use client";

import { useState } from "react";
import { Gauge, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ListProjectNfrsParams } from "@/lib/api/services/fetchNfr";
import { cn } from "@/lib/utils";

import {
  NFR_CATEGORY_FILTER_OPTIONS,
  NFR_PRIORITY_FILTER_OPTIONS,
  NfrCategoryFilterDisplay,
  NfrCategoryOptionContent,
  nfrPriorityFilterLabel,
  type NfrCategoryFilter,
  type NfrPriorityFilter,
} from "./nfrCategoryMeta";
import { NfrFormDialog } from "./nfrFormDialog";

type NfrToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: NfrCategoryFilter;
  onCategoryFilterChange: (value: NfrCategoryFilter) => void;
  priorityFilter: NfrPriorityFilter;
  onPriorityFilterChange: (value: NfrPriorityFilter) => void;
  projectId: string | null;
  canCreate?: boolean;
  className?: string;
};

export function nfrToolbarFiltersToListParams(
  categoryFilter: NfrCategoryFilter,
  priorityFilter: NfrPriorityFilter
): ListProjectNfrsParams | undefined {
  const params: ListProjectNfrsParams = {};
  if (categoryFilter !== "all") params.category = categoryFilter;
  if (priorityFilter !== "all") params.priority = priorityFilter;
  return Object.keys(params).length > 0 ? params : undefined;
}

export function NfrToolbar({
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  projectId,
  canCreate = true,
  className,
}: NfrToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const createDisabled = !canCreate || !projectId;

  return (
    <>
      <header className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-primary">
              <Gauge className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Non-Functional Requirements
              </h1>
              <p className="text-sm text-pretty text-muted-foreground">
                Non-functional requirements: performance, security, availability, and more
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
              placeholder="Search by NFR description…"
              autoComplete="off"
              aria-label="Search NFRs"
              className="h-10 w-full border-border/80 bg-muted/40 pr-3 pl-10 text-sm shadow-none"
            />
          </div>

          <Select
            value={categoryFilter}
            onValueChange={(v) =>
              onCategoryFilterChange(v as NfrCategoryFilter)
            }
          >
            <SelectTrigger
              className="h-10 w-full shrink-0 border-border/80 bg-muted/40 sm:w-50"
              aria-label="Filter by category"
            >
              <SelectValue>
                <NfrCategoryFilterDisplay value={categoryFilter} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {NFR_CATEGORY_FILTER_OPTIONS.map((opt) => {
                if (opt.value === "all") {
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      All Categories
                    </SelectItem>
                  );
                }
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <NfrCategoryOptionContent category={opt.value} />
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(v) =>
              onPriorityFilterChange(v as NfrPriorityFilter)
            }
          >
            <SelectTrigger
              className="h-10 w-full shrink-0 border-border/80 bg-muted/40 sm:w-40"
              aria-label="Filter by priority"
            >
              <SelectValue>
                {nfrPriorityFilterLabel(priorityFilter)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {NFR_PRIORITY_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <NfrFormDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        disabled={createDisabled}
      />
    </>
  );
}
