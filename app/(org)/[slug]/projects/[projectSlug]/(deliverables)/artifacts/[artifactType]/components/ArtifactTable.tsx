import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type {
  Artifact,
  ArtifactChangeSource,
  ArtifactCurrentVersionStatus,
  ArtifactPriority,
  ArtifactStatus,
  ArtifactVersionReviewStatus,
} from "@/lib/api/services/fetchArtifact";

export const STATUS_CLASS: Record<ArtifactStatus, string> = {
  draft: "border-border/70 bg-muted text-muted-foreground",
  needs_clarification:
    "border-amber-400/30 bg-amber-400/10 text-amber-200",
  accepted: "border-primary/35 bg-primary/15 text-brand-mint",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
  archived: "border-border/70 bg-muted/70 text-foreground",
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

const VERSION_STATUS_LABELS: Record<ArtifactCurrentVersionStatus, string> = {
  draft: "Draft",
  proposed: "Proposed",
  accepted: "Accepted",
  rejected: "Rejected",
  archived: "Archived",
};

const REVIEW_STATUS_LABELS: Record<ArtifactVersionReviewStatus, string> = {
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
};

const CHANGE_SOURCE_LABELS: Record<ArtifactChangeSource, string> = {
  manual: "Manual",
  ai_output: "AI generated",
  ai_generation: "AI generated",
  import: "Imported",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : dateFormatter.format(date);
}

function formatToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatConfidence(value: number): string {
  const percentage = value <= 1 ? value * 100 : value;
  return `${Math.round(Math.max(0, Math.min(percentage, 100)))}% confidence`;
}

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
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card/35">
      <Table className="min-w-[1080px] table-fixed">
        <TableCaption className="sr-only">
          {typeLabel} artifacts with their current content, classification,
          status, version, source, and update date.
        </TableCaption>
        <TableHeader className="bg-muted/45">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="w-[42%] px-4 text-xs">
              Artifact
            </TableHead>
            <TableHead scope="col" className="w-[15%] px-3 text-xs">
              Attributes
            </TableHead>
            <TableHead scope="col" className="w-[13%] px-3 text-xs">
              Status
            </TableHead>
            <TableHead scope="col" className="w-[10%] px-3 text-xs">
              Version
            </TableHead>
            <TableHead scope="col" className="w-[10%] px-3 text-xs">
              Source
            </TableHead>
            <TableHead scope="col" className="w-[10%] px-4 text-xs">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {artifacts.map((artifact) => {
            const currentVersion = artifact.currentVersion;
            const title =
              currentVersion?.title ?? artifact.title ?? "Untitled artifact";
            const body = currentVersion?.body.trim() ?? "";
            const hasLongBody =
              body.length > 240 || body.split(/\r?\n/).length > 3;
            const updatedAt = currentVersion?.createdAt ?? artifact.createdAt;

            return (
              <TableRow key={artifact.id} className="hover:bg-muted/25">
                <TableCell className="px-4 py-4 align-top whitespace-normal">
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {artifact.code ? (
                        <Badge
                          variant="outline"
                          className="font-mono font-medium"
                        >
                          {artifact.code}
                        </Badge>
                      ) : null}
                      <p className="min-w-0 text-pretty text-sm font-semibold leading-5 text-foreground">
                        {title}
                      </p>
                    </div>
                    {body && hasLongBody ? (
                      <details className="group max-w-[70ch]">
                        <summary className="cursor-pointer list-none rounded-sm text-xs text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45 [&::-webkit-details-marker]:hidden">
                          <span className="line-clamp-3 text-pretty leading-5 group-open:hidden">
                            {body}
                          </span>
                          <span className="mt-1.5 inline-flex font-medium text-primary group-open:hidden">
                            Show full content
                          </span>
                          <span className="hidden font-medium text-primary group-open:inline">
                            Show less
                          </span>
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap break-words text-pretty text-xs leading-5 text-muted-foreground">
                          {body}
                        </p>
                      </details>
                    ) : body ? (
                      <p className="max-w-[70ch] whitespace-pre-wrap break-words text-pretty text-xs leading-5 text-muted-foreground">
                        {body}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No description provided.
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-3 py-4 align-top whitespace-normal">
                  <div className="flex flex-col items-start gap-1.5">
                    {artifact.priority ? (
                      <Badge variant="outline">
                        {PRIORITY_LABELS[artifact.priority]} priority
                      </Badge>
                    ) : null}
                    {artifact.nfrCategory ? (
                      <span className="text-pretty text-xs leading-5 text-foreground">
                        {formatToken(artifact.nfrCategory)}
                      </span>
                    ) : null}
                    {artifact.stakeholderRole ? (
                      <span className="text-pretty text-xs leading-5 text-foreground">
                        {formatToken(artifact.stakeholderRole)}
                      </span>
                    ) : null}
                    {artifact.confidence !== null ? (
                      <span className="text-xs leading-5 text-muted-foreground tabular-nums">
                        {formatConfidence(artifact.confidence)}
                      </span>
                    ) : null}
                    {!artifact.priority &&
                    !artifact.nfrCategory &&
                    !artifact.stakeholderRole &&
                    artifact.confidence === null ? (
                      <span className="text-xs text-muted-foreground">
                        Not specified
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell className="px-3 py-4 align-top whitespace-normal">
                  <div className="flex flex-col items-start gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(STATUS_CLASS[artifact.status])}
                    >
                      {STATUS_LABELS[artifact.status]}
                    </Badge>
                    {currentVersion?.status &&
                    currentVersion.status !== artifact.status ? (
                      <span className="text-xs leading-5 text-muted-foreground">
                        Version:{" "}
                        {VERSION_STATUS_LABELS[currentVersion.status]}
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell className="px-3 py-4 align-top whitespace-normal">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {currentVersion?.versionNumber
                        ? `v${currentVersion.versionNumber}`
                        : "Current"}
                    </span>
                    {currentVersion?.reviewStatus ? (
                      <span className="text-pretty text-xs leading-5 text-muted-foreground">
                        {REVIEW_STATUS_LABELS[currentVersion.reviewStatus]}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Not reviewed
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-3 py-4 align-top whitespace-normal">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium leading-5 text-foreground">
                      {currentVersion
                        ? CHANGE_SOURCE_LABELS[currentVersion.changeSource]
                        : "Unknown"}
                    </span>
                    {currentVersion?.changeSummary ? (
                      <span className="line-clamp-2 text-pretty text-xs leading-5 text-muted-foreground">
                        {currentVersion.changeSummary}
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell className="px-4 py-4 align-top whitespace-normal">
                  <time
                    dateTime={updatedAt}
                    title={`${updatedAt} (UTC)`}
                    className="text-xs leading-5 text-foreground tabular-nums"
                  >
                    {formatDate(updatedAt)}
                  </time>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
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
