"use client";

import { useState } from "react";
import { Ban, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConstraintSeverity, ConstraintType } from "@/hooks/useConstraint";
import {
  CONSTRAINT_SEVERITIES,
  CONSTRAINT_TYPES,
} from "@/lib/api/services/fetchConstraint";
import { cn } from "@/lib/utils";

import { ConstraintFormDialog } from "./constrainFormDialog";
import {
  CONSTRAINT_SEVERITY_LABELS,
  CONSTRAINT_TYPE_LABELS,
} from "./constraintFormFields";

export type ConstraintTypeFilter = ConstraintType | "all";
export type ConstraintSeverityFilter = ConstraintSeverity | "all";

function typeFilterLabel(value: ConstraintTypeFilter): string {
  if (value === "all") return "Tất cả loại";
  return CONSTRAINT_TYPE_LABELS[value];
}

function severityFilterLabel(value: ConstraintSeverityFilter): string {
  if (value === "all") return "Tất cả mức độ";
  return CONSTRAINT_SEVERITY_LABELS[value];
}

type ConstraintToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: ConstraintTypeFilter;
  onTypeFilterChange: (value: ConstraintTypeFilter) => void;
  severityFilter: ConstraintSeverityFilter;
  onSeverityFilterChange: (value: ConstraintSeverityFilter) => void;
  projectId: string | null;
  canCreate?: boolean;
  className?: string;
};

export function ConstraintToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  severityFilter,
  onSeverityFilterChange,
  projectId,
  canCreate = true,
  className,
}: ConstraintToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const createDisabled = !canCreate || !projectId;

  return (
    <>
      <header className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-primary">
              <Ban className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Constraints
              </h1>
              <p className="text-sm text-pretty text-muted-foreground">
                Theo dõi giới hạn về ngân sách, timeline, kỹ thuật và nguồn lực
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
            Thêm mới
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
              placeholder="Tìm theo mô tả, loại hoặc mức độ..."
              autoComplete="off"
              aria-label="Tìm constraint"
              className="h-10 w-full border-border/80 bg-muted/40 pr-3 pl-10 text-sm shadow-none"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(value) =>
              onTypeFilterChange(value as ConstraintTypeFilter)
            }
          >
            <SelectTrigger
              className="h-10 w-full shrink-0 border-border/80 bg-muted/40 sm:w-44"
              aria-label="Lọc constraint theo loại"
            >
              <SelectValue>{typeFilterLabel(typeFilter)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="Tất cả loại">
                Tất cả loại
              </SelectItem>
              {CONSTRAINT_TYPES.map((type) => (
                <SelectItem
                  key={type}
                  value={type}
                  label={CONSTRAINT_TYPE_LABELS[type]}
                >
                  {CONSTRAINT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={severityFilter}
            onValueChange={(value) =>
              onSeverityFilterChange(value as ConstraintSeverityFilter)
            }
          >
            <SelectTrigger
              className="h-10 w-full shrink-0 border-border/80 bg-muted/40 sm:w-44"
              aria-label="Lọc constraint theo mức độ"
            >
              <SelectValue>{severityFilterLabel(severityFilter)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="Tất cả mức độ">
                Tất cả mức độ
              </SelectItem>
              {CONSTRAINT_SEVERITIES.map((severity) => (
                <SelectItem
                  key={severity}
                  value={severity}
                  label={CONSTRAINT_SEVERITY_LABELS[severity]}
                >
                  {CONSTRAINT_SEVERITY_LABELS[severity]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <ConstraintFormDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        disabled={createDisabled}
      />
    </>
  );
}
