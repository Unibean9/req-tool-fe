import { Loader2, Search, X } from "lucide-react";

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
  ARTIFACT_CURRENT_VERSION_STATUSES,
  ARTIFACT_PHASES,
  ARTIFACT_PRIORITIES,
  ARTIFACT_STATUSES,
  WORKFLOW_STEP_KEYS,
  type ArtifactCurrentVersionStatus,
  type ArtifactPhase,
  type ArtifactPriority,
  type ArtifactStatus,
  type WorkflowStepKey,
} from "@/lib/api/services/fetchArtifact";

export type ArtifactFilters = {
  search: string;
  status: ArtifactStatus | "all";
  stepKey: WorkflowStepKey | "all";
  phase: ArtifactPhase | "all";
  priority: ArtifactPriority | "all";
  currentVersionStatus: ArtifactCurrentVersionStatus | "all";
};

export const INITIAL_FILTERS: ArtifactFilters = {
  search: "",
  status: "all",
  stepKey: "all",
  phase: "all",
  priority: "all",
  currentVersionStatus: "all",
};

type ArtifactToolbarProps = {
  filters: ArtifactFilters;
  onFiltersChange: (patch: Partial<ArtifactFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  isFetching?: boolean;
};

const STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: "Draft",
  needs_clarification: "Needs Clarification",
  accepted: "Accepted",
  rejected: "Rejected",
  archived: "Archived",
};

const STEP_KEY_LABELS: Record<WorkflowStepKey, string> = {
  intent_vision: "Intent & Vision",
  capability_map: "Capability Map",
  domain_model: "Domain Model",
  requirements_spec: "Requirements Spec",
  realization_backlog: "Realization Backlog",
};

const PHASE_LABELS: Record<ArtifactPhase, string> = {
  brd: "BRD",
  srs: "SRS",
  delivery: "Delivery",
};

const PRIORITY_LABELS: Record<ArtifactPriority, string> = {
  must: "Must",
  should: "Should",
  could: "Could",
  wont: "Won't",
};

const VERSION_STATUS_LABELS: Record<ArtifactCurrentVersionStatus, string> = {
  draft: "Draft",
  proposed: "Proposed",
  accepted: "Accepted",
  rejected: "Rejected",
  archived: "Archived",
};

function FilterSelect<T extends string>({
  value,
  onChange,
  placeholder,
  options,
  labels,
}: {
  value: T | "all";
  onChange: (v: T | "all") => void;
  placeholder: string;
  options: readonly T[];
  labels: Record<T, string>;
}) {
  return (
    <Select
      value={value as string}
      onValueChange={(v) => onChange(v as T | "all")}
    >
      <SelectTrigger className="h-8 w-auto min-w-30 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="text-xs">
            {labels[opt]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ArtifactToolbar({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  isFetching,
}: ArtifactToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-50 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          placeholder="Search title, description, or code…"
          aria-label="Search artifacts"
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="h-8 pl-8 text-xs"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onFiltersChange({ search: "" })}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      <FilterSelect
        value={filters.status}
        onChange={(v) => onFiltersChange({ status: v })}
        placeholder="Status"
        options={ARTIFACT_STATUSES}
        labels={STATUS_LABELS}
      />
      <FilterSelect
        value={filters.stepKey}
        onChange={(v) => onFiltersChange({ stepKey: v })}
        placeholder="Step"
        options={WORKFLOW_STEP_KEYS}
        labels={STEP_KEY_LABELS}
      />
      <FilterSelect
        value={filters.phase}
        onChange={(v) => onFiltersChange({ phase: v })}
        placeholder="Phase"
        options={ARTIFACT_PHASES}
        labels={PHASE_LABELS}
      />
      <FilterSelect
        value={filters.priority}
        onChange={(v) => onFiltersChange({ priority: v })}
        placeholder="Priority"
        options={ARTIFACT_PRIORITIES}
        labels={PRIORITY_LABELS}
      />
      <FilterSelect
        value={filters.currentVersionStatus}
        onChange={(v) => onFiltersChange({ currentVersionStatus: v })}
        placeholder="Version"
        options={ARTIFACT_CURRENT_VERSION_STATUSES}
        labels={VERSION_STATUS_LABELS}
      />

      {isFetching && (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-label="Loading" />
      )}

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onClearFilters}
        >
          <X className="mr-1 size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
