"use client";

import { useState } from "react";
import { Plus, Scale, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROJECT_RULE_TYPES,
  type ProjectRuleType,
} from "@/lib/api/services/fetchRule";
import { cn } from "@/lib/utils";

import { RuleFormDialog } from "./ruleFormDialog";

export type RuleTypeFilter = ProjectRuleType | "all";
export type RuleDynamicFilter = "all" | "dynamic" | "static";

const RULE_TYPE_LABELS: Record<ProjectRuleType, string> = {
  constraint: "Constraint",
  calculation: "Calculation",
  validation: "Validation",
  process: "Process",
  policy: "Policy",
  regulation: "Regulation",
};

function ruleTypeFilterLabel(value: RuleTypeFilter): string {
  if (value === "all") return "All";
  return RULE_TYPE_LABELS[value];
}

function ruleDynamicFilterLabel(value: RuleDynamicFilter): string {
  if (value === "all") return "All";
  return value === "dynamic" ? "Dynamic" : "Static";
}

type RuleToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: RuleTypeFilter;
  onTypeFilterChange: (value: RuleTypeFilter) => void;
  dynamicFilter: RuleDynamicFilter;
  onDynamicFilterChange: (value: RuleDynamicFilter) => void;
  projectId: string | null;
  canCreate?: boolean;
  className?: string;
};

export function RuleToolbar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  dynamicFilter,
  onDynamicFilterChange,
  projectId,
  canCreate = true,
  className,
}: RuleToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const createDisabled = !canCreate || !projectId;

  return (
    <>
      <header className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-primary">
              <Scale className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Rules
              </h1>
              <p className="text-sm text-pretty text-muted-foreground">
                Business rules and constraints linked to features
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
              placeholder="Search by definition, type, or source…"
              autoComplete="off"
              aria-label="Search rules"
              className="h-10 w-full border-border/80 bg-muted/40 pr-3 pl-10 text-sm shadow-none"
            />
          </div>

          <Select
            value={typeFilter}
            onValueChange={(value) => onTypeFilterChange(value as RuleTypeFilter)}
          >
            <SelectTrigger
              className="h-10 w-full shrink-0 border-border/80 bg-muted/40 sm:w-45"
              aria-label="Filter rules by type"
            >
              <SelectValue placeholder="Type">
                {ruleTypeFilterLabel(typeFilter)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="All">
                All
              </SelectItem>
              {PROJECT_RULE_TYPES.map((type) => (
                <SelectItem key={type} value={type} label={RULE_TYPE_LABELS[type]}>
                  {RULE_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dynamicFilter}
            onValueChange={(value) =>
              onDynamicFilterChange(value as RuleDynamicFilter)
            }
          >
            <SelectTrigger
              className="h-10 w-full shrink-0 border-border/80 bg-muted/40 sm:w-40"
              aria-label="Filter rules by status"
            >
              <SelectValue placeholder="Status">
                {ruleDynamicFilterLabel(dynamicFilter)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" label="All">
                All
              </SelectItem>
              <SelectItem value="dynamic" label="Dynamic">
                Dynamic
              </SelectItem>
              <SelectItem value="static" label="Static">
                 Static
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <RuleFormDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        disabled={createDisabled}
      />
    </>
  );
}
