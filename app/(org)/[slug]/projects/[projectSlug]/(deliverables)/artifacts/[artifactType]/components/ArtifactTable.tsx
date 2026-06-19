import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Artifact, ArtifactStatus, ArtifactPriority } from "@/lib/api/services/fetchArtifact";

export const STATUS_CLASS: Record<ArtifactStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border/50",
  needs_clarification: "bg-amber-500/10 text-amber-700 border-amber-200",
  accepted: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  archived: "bg-purple-500/10 text-purple-600 border-purple-200",
};

export const STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: "Draft",
  needs_clarification: "Needs Clarification",
  accepted: "Accepted",
  rejected: "Rejected",
  archived: "Archived",
};

export const PRIORITY_LABELS: Record<ArtifactPriority, string> = {
  must: "Must",
  should: "Should",
  could: "Could",
  wont: "Won't",
};

type ArtifactTableProps = {
  artifacts: Artifact[];
  typeLabel: string;
};

export function ArtifactTable({ artifacts, typeLabel }: ArtifactTableProps) {
  if (artifacts.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/20 px-5 py-12 text-center">
        <p className="text-sm font-medium text-foreground">
          No results match your filters
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {artifacts.map((a) => (
        <li
          key={a.id}
          className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-muted/30"
        >
          {a.code ? (
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {a.code}
            </span>
          ) : null}
          <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
            {a.title}
          </span>
          {a.priority ? (
            <span className="shrink-0 text-xs text-muted-foreground">
              {PRIORITY_LABELS[a.priority]}
            </span>
          ) : null}
          <Badge
            variant="outline"
            className={cn("shrink-0 text-xs", STATUS_CLASS[a.status])}
          >
            {STATUS_LABELS[a.status] ?? a.status.replace(/_/g, " ")}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function ArtifactEmptyState({ typeLabel }: { typeLabel: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-5 py-12 text-center">
      <p className="text-sm font-medium text-foreground">
        No {typeLabel.toLowerCase()} yet
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Artifacts of this type will appear here.
      </p>
    </div>
  );
}
