"use client";

import { useState } from "react";
import { ClipboardList, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BR_PRIORITIES } from "@/lib/api/services/fetchBR";
import type { BRPriority } from "@/hooks/useBR";
import { cn } from "@/lib/utils";

import { BRFormDialog } from "./brFormDialog";

export type BRPriorityFilter = BRPriority | "all";

export const BR_PRIORITY_LABELS: Record<BRPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

type BRToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: BRPriorityFilter;
  onPriorityFilterChange: (value: BRPriorityFilter) => void;
  projectId: string | null;
  canCreate?: boolean;
  className?: string;
};

export function BRToolbar({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange,
  projectId,
  canCreate = true,
  className,
}: BRToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const createDisabled = !canCreate || !projectId;

  return (
    <>
      <header className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-primary">
              <ClipboardList className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Business Requirements
              </h1>
              <p className="text-sm text-pretty text-muted-foreground">
                Document the core business requirements of the project
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
              placeholder="Search by description…"
              autoComplete="off"
              aria-label="Search business requirements"
              className="h-10 w-full border-border/80 bg-muted/40 pr-3 pl-10 text-sm shadow-none"
            />
          </div>

          <Select
            value={priorityFilter}
            onValueChange={(value) =>
              onPriorityFilterChange(value as BRPriorityFilter)
            }
          >
            <SelectTrigger
              className="h-10 w-full shrink-0 border-border/80 bg-muted/40 sm:w-44"
              aria-label="Filter by priority"
            >
              <SelectValue>
                {priorityFilter === "all"
                  ? "All priorities"
                  : BR_PRIORITY_LABELS[priorityFilter]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="All priorities">
                All priorities
              </SelectItem>
              {BR_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p} label={BR_PRIORITY_LABELS[p]}>
                  {BR_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <BRFormDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        disabled={createDisabled}
      />
    </>
  );
}
