"use client";

import { useState } from "react";
import { ArrowUpRight, FileText } from "lucide-react";

import { MarkdownContent } from "@/components/shared/markdownContent";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Artifact,
  ArtifactChangeSource,
  ArtifactCurrentVersionStatus,
  ArtifactPriority,
  ArtifactStatus,
  ArtifactVersionReviewStatus,
} from "@/lib/api/services/fetchArtifact";
import { cn } from "@/lib/utils";

export const STATUS_CLASS: Record<ArtifactStatus, string> = {
  draft: "border-border/70 bg-muted text-muted-foreground",
  needs_clarification:
    "border-amber-400/30 bg-amber-400/10 text-amber-200",
  accepted: "border-primary/35 bg-primary/15 text-brand-mint",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
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
  timeZone: "Asia/Ho_Chi_Minh",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : dateFormatter.format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : dateTimeFormatter.format(date);
}

function formatToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatConfidence(value: number): string {
  const percentage = value <= 1 ? value * 100 : value;
  return `${Math.round(Math.max(0, Math.min(percentage, 100)))}%`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function shouldHideMetadataKey(key: string): boolean {
  const normalized = key.trim().toLowerCase().replace(/-/g, "_");
  return (
    normalized === "id" ||
    normalized === "ids" ||
    normalized.endsWith("_id") ||
    normalized.endsWith("_ids")
  );
}

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeMetadata);
  if (!isRecord(value)) return value;

  const sanitized: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (!shouldHideMetadataKey(key)) {
      sanitized[key] = sanitizeMetadata(nestedValue);
    }
  }
  return sanitized;
}

function hasVisibleMetadata(value: Record<string, unknown>): boolean {
  return (
    Object.keys(sanitizeMetadata(value) as Record<string, unknown>).length > 0
  );
}

function MetadataValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">Not specified</span>;
  }

  if (typeof value === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">No values</span>;
    }

    const keyOccurrences = new Map<string, number>();
    const items = value.map((item) => {
      const keyBase = JSON.stringify(sanitizeMetadata(item)) ?? String(item);
      const occurrence = keyOccurrences.get(keyBase) ?? 0;
      keyOccurrences.set(keyBase, occurrence + 1);
      return {
        key: `${keyBase}:${occurrence}`,
        value: item,
      };
    });

    return (
      <ul className="flex list-disc flex-col gap-1 pl-4">
        {items.map((item) => (
          <li key={item.key}>
            <MetadataValue value={item.value} />
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).filter(
      ([key]) => !shouldHideMetadataKey(key)
    );

    if (entries.length === 0) {
      return <span className="text-muted-foreground">No visible details</span>;
    }

    return (
      <dl className="flex flex-col gap-2.5">
        {entries.map(([key, nestedValue]) => (
          <div key={key} className="flex flex-col gap-1">
            <dt className="text-xs font-medium text-muted-foreground">
              {formatToken(key)}
            </dt>
            <dd className="wrap-break-word text-foreground/90">
              <MetadataValue value={nestedValue} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span className="wrap-break-word">{String(value)}</span>;
}

function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 bg-background/45 px-3.5 py-3.5",
        className
      )}
    >
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 text-pretty text-sm font-medium leading-5 text-foreground">
        {children}
      </dd>
    </div>
  );
}

function ArtifactDetailDialog({
  artifact,
  open,
  onOpenChange,
}: {
  artifact: Artifact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!artifact) return null;

  const currentVersion = artifact.currentVersion;
  const title =
    currentVersion?.title ?? artifact.title ?? "Untitled artifact";
  const body = currentVersion?.body.trim() ?? "";
  const updatedAt = currentVersion?.createdAt ?? artifact.createdAt;
  const artifactMetadata = sanitizeMetadata(artifact.metadata);
  const versionMetadata = sanitizeMetadata(currentVersion?.metadata ?? {});
  const showArtifactMetadata = hasVisibleMetadata(artifact.metadata);
  const showVersionMetadata = hasVisibleMetadata(
    currentVersion?.metadata ?? {}
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-2 h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none -translate-y-0 overflow-hidden rounded-xl sm:top-4 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-none"
        contentClassName="relative flex h-full min-h-0 flex-col overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="shrink-0 gap-3 border-b border-border/70 px-5 py-4 pr-14 text-left sm:px-7 sm:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <FileText data-icon="inline-start" aria-hidden />
              {formatToken(artifact.type)}
            </Badge>
            <Badge
              variant="outline"
              className={cn(STATUS_CLASS[artifact.status])}
            >
              {STATUS_LABELS[artifact.status]}
            </Badge>
            <Badge variant="outline" className="tabular-nums">
              {currentVersion?.versionNumber
                ? `Version ${currentVersion.versionNumber}`
                : "Current version"}
            </Badge>
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-balance break-words text-xl font-semibold leading-tight sm:text-2xl">
              {title}
            </DialogTitle>
            <DialogDescription className="text-pretty">
              Read the current artifact content and its supporting information.
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="grid min-h-full grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)]">
            <article className="min-w-0 px-5 py-6 sm:px-7 sm:py-8 lg:px-10 lg:py-9">
              {body ? (
                <MarkdownContent content={body} variant="document" />
              ) : (
                <div className="rounded-xl bg-muted/35 px-5 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">
                    No content yet
                  </p>
                  <p className="mt-1 text-pretty text-sm text-muted-foreground">
                    This artifact does not have a body in its current version.
                  </p>
                </div>
              )}
            </article>

            <aside className="border-t border-border/70 bg-muted/20 px-5 py-6 sm:px-7 lg:border-t-0 lg:border-l lg:px-5 lg:py-8">
              <div className="flex flex-col gap-5 lg:sticky lg:top-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-balance font-heading text-lg font-medium text-foreground">
                      Artifact details
                    </h2>
                    <p className="text-pretty text-sm leading-5 text-muted-foreground">
                      Current snapshot and activity.
                    </p>
                  </div>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-brand-mint">
                    <FileText className="size-4" aria-hidden />
                  </div>
                </div>

                <section className="flex flex-col gap-2.5">
                  <h3 className="text-sm font-medium text-foreground">
                    Overview
                  </h3>
                  <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border/60">
                    <DetailItem label="Type">
                      {formatToken(artifact.type)}
                    </DetailItem>
                    <DetailItem label="Status">
                      <Badge
                        variant="outline"
                        className={cn(STATUS_CLASS[artifact.status])}
                      >
                        {STATUS_LABELS[artifact.status]}
                      </Badge>
                    </DetailItem>
                    <DetailItem label="Version">
                      <span className="tabular-nums">
                        {currentVersion?.versionNumber
                          ? `v${currentVersion.versionNumber}`
                          : "Current"}
                      </span>
                    </DetailItem>
                    {currentVersion?.status ? (
                      <DetailItem label="Version status">
                        {VERSION_STATUS_LABELS[currentVersion.status]}
                      </DetailItem>
                    ) : null}
                    {artifact.code ? (
                      <DetailItem label="Code">
                        <span className="font-mono text-xs">
                          {artifact.code}
                        </span>
                      </DetailItem>
                    ) : null}
                    {artifact.priority ? (
                      <DetailItem label="Priority">
                        {PRIORITY_LABELS[artifact.priority]}
                      </DetailItem>
                    ) : null}
                    {artifact.confidence !== null ? (
                      <DetailItem label="Confidence">
                        <span className="tabular-nums">
                          {formatConfidence(artifact.confidence)}
                        </span>
                      </DetailItem>
                    ) : null}
                    {artifact.nfrCategory ? (
                      <DetailItem label="NFR category">
                        {formatToken(artifact.nfrCategory)}
                      </DetailItem>
                    ) : null}
                    {artifact.stakeholderRole ? (
                      <DetailItem
                        label="Stakeholder role"
                        className="col-span-2"
                      >
                        {formatToken(artifact.stakeholderRole)}
                      </DetailItem>
                    ) : null}
                  </dl>
                </section>

                <section className="flex flex-col gap-2.5">
                  <h3 className="text-sm font-medium text-foreground">
                    Activity
                  </h3>
                  <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border/60">
                    {currentVersion ? (
                      <DetailItem
                        label="Change source"
                        className={
                          currentVersion.reviewStatus
                            ? undefined
                            : "col-span-2"
                        }
                      >
                        {CHANGE_SOURCE_LABELS[currentVersion.changeSource]}
                      </DetailItem>
                    ) : null}
                    {currentVersion?.reviewStatus ? (
                      <DetailItem label="Review status">
                        {REVIEW_STATUS_LABELS[currentVersion.reviewStatus]}
                      </DetailItem>
                    ) : null}
                    {currentVersion?.changeSummary ? (
                      <DetailItem
                        label="Change summary"
                        className="col-span-2"
                      >
                        {currentVersion.changeSummary}
                      </DetailItem>
                    ) : null}
                    <DetailItem label="Created">
                      <time
                        dateTime={artifact.createdAt}
                        className="tabular-nums"
                      >
                        {formatDateTime(artifact.createdAt)}
                      </time>
                    </DetailItem>
                    <DetailItem label="Updated">
                      <time dateTime={updatedAt} className="tabular-nums">
                        {formatDateTime(updatedAt)}
                      </time>
                    </DetailItem>
                  </dl>
                </section>

                {showArtifactMetadata || showVersionMetadata ? (
                  <section className="flex flex-col gap-2.5">
                    <h3 className="text-sm font-medium text-foreground">
                      Additional metadata
                    </h3>
                    <div className="flex flex-col gap-4 rounded-xl bg-background/45 p-4">
                      {showArtifactMetadata ? (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs font-medium text-muted-foreground">
                            Artifact
                          </p>
                          <div className="text-sm leading-5 text-foreground">
                            <MetadataValue value={artifactMetadata} />
                          </div>
                        </div>
                      ) : null}
                      {showArtifactMetadata && showVersionMetadata ? (
                        <Separator className="bg-border/70" />
                      ) : null}
                      {showVersionMetadata ? (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-xs font-medium text-muted-foreground">
                            Current version
                          </p>
                          <div className="text-sm leading-5 text-foreground">
                            <MetadataValue value={versionMetadata} />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>
                ) : null}
              </div>
            </aside>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

type ArtifactTableProps = {
  artifacts: Artifact[];
  typeLabel: string;
};

export function ArtifactTable({ artifacts, typeLabel }: ArtifactTableProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openArtifact = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    setIsDetailOpen(true);
  };

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
    <>
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/35">
        <Table className="min-w-[640px] table-fixed">
          <TableCaption className="sr-only">
            {typeLabel} artifacts with their status, current version, and last
            update date. Open an artifact to read its full content.
          </TableCaption>
          <TableHeader className="bg-muted/45">
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col" className="w-[55%] px-4 text-xs">
                Artifact
              </TableHead>
              <TableHead scope="col" className="w-[17%] px-3 text-xs">
                Status
              </TableHead>
              <TableHead scope="col" className="w-[13%] px-3 text-xs">
                Version
              </TableHead>
              <TableHead scope="col" className="w-[15%] px-4 text-xs">
                Updated
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {artifacts.map((artifact) => {
              const currentVersion = artifact.currentVersion;
              const title =
                currentVersion?.title ?? artifact.title ?? "Untitled artifact";
              const updatedAt =
                currentVersion?.createdAt ?? artifact.createdAt;

              return (
                <TableRow
                  key={artifact.id}
                  className="group cursor-pointer hover:bg-muted/30"
                  onClick={() => openArtifact(artifact)}
                >
                  <TableCell className="px-4 py-3.5 whitespace-normal">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          {artifact.code ? (
                            <Badge
                              variant="outline"
                              className="shrink-0 font-mono font-medium"
                            >
                              {artifact.code}
                            </Badge>
                          ) : null}
                          <button
                            type="button"
                            className="min-w-0 truncate rounded-sm text-left text-sm font-semibold text-foreground outline-none transition-colors duration-150 hover:text-brand-mint focus-visible:ring-[3px] focus-visible:ring-ring/45 motion-reduce:transition-none"
                            onClick={(event) => {
                              event.stopPropagation();
                              openArtifact(artifact);
                            }}
                            aria-label={`View artifact details: ${title}`}
                          >
                            {title}
                          </button>
                        </div>
                      </div>
                      <ArrowUpRight
                        className="size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
                        aria-hidden
                      />
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-3.5 whitespace-normal">
                    <Badge
                      variant="outline"
                      className={cn(STATUS_CLASS[artifact.status])}
                    >
                      {STATUS_LABELS[artifact.status]}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-3 py-3.5 whitespace-normal">
                    <span className="text-sm font-medium text-foreground tabular-nums">
                      {currentVersion?.versionNumber
                        ? `v${currentVersion.versionNumber}`
                        : "Current"}
                    </span>
                  </TableCell>

                  <TableCell className="px-4 py-3.5 whitespace-normal">
                    <time
                      dateTime={updatedAt}
                      title={formatDateTime(updatedAt)}
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

      <ArtifactDetailDialog
        artifact={selectedArtifact}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </>
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
