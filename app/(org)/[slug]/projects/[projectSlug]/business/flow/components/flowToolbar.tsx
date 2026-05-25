"use client";

import { useState } from "react";
import { Plus, Search, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { CreateFlowFormDialog } from "./form/createFlowFormDialog";

type FlowToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  projectId: string | null;
  canCreate?: boolean;
  className?: string;
};

export function FlowToolbar({
  search,
  onSearchChange,
  projectId,
  canCreate = true,
  className,
}: FlowToolbarProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const createDisabled = !canCreate || !projectId;

  return (
    <>
      <header className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-primary">
              <Workflow className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Business Flows
              </h1>
              <p className="text-sm text-muted-foreground text-pretty">
                Define the steps in your business process
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

        <div className="relative min-h-10 w-full">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by flow name or step…"
            autoComplete="off"
            aria-label="Search business flows"
            className="h-10 w-full border-border/80 bg-muted/40 pr-3 pl-10 text-sm shadow-none"
          />
        </div>
      </header>

      <CreateFlowFormDialog
        projectId={projectId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        disabled={createDisabled}
      />
    </>
  );
}
