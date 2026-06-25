"use client";

import { useMemo } from "react";
import { PenLine } from "lucide-react";

import { MarkdownContent } from "@/components/shared/markdownContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocument, useDocumentItem } from "@/hooks/useDocument";
import {
  DOCUMENT_TYPE_SHORT,
  getDocumentItemIcon,
} from "@/lib/document/documentItemIcons";
import type { DocumentType } from "@/lib/api/services/fetchDocument";
import { cn } from "@/lib/utils";

import {
  DocumentPageGrid,
  DocumentPageHeader,
  DocumentPageMainColumn,
  DOCUMENT_PAGE_INNER_CLASS,
  DOCUMENT_PAGE_SCROLL_CLASS,
} from "./documentPageHeader";
import {
  PRIORITY_LABELS,
  STATUS_CLASS,
  STATUS_LABELS,
} from "../../artifacts/[artifactType]/components/ArtifactTable";
import type {
  ArtifactPriority,
  ArtifactStatus,
} from "@/lib/api/services/fetchArtifact";

type DocumentItemPageProps = {
  projectId: string | null;
  documentType: DocumentType;
  itemType: string;
  isProjectsPending: boolean;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

export function DocumentItemPage({
  projectId,
  documentType,
  itemType,
  isProjectsPending,
}: DocumentItemPageProps) {
  const { data: document, isPending: isDocumentPending } = useDocument(
    projectId,
    documentType,
    { enabled: Boolean(projectId) },
  );

  const slot = useMemo(
    () =>
      document?.items.find((item) => item.artifactType === itemType) ?? null,
    [document?.items, itemType],
  );

  const hasArtifact = Boolean(slot?.artifactId);

  const {
    data: item,
    isPending: isItemPending,
    isError,
    error,
    refetch,
  } = useDocumentItem(projectId, documentType, itemType, {
    enabled: Boolean(projectId) && hasArtifact,
  });

  const label = slot?.label ?? item?.label ?? itemType.replace(/_/g, " ");
  const description = slot?.description ?? item?.description ?? null;
  const Icon = getDocumentItemIcon(itemType);

  const isInitialLoad =
    isProjectsPending || !projectId || (isDocumentPending && !document);

  const status: ArtifactStatus | null = item?.status ?? slot?.status ?? null;
  const body = item?.currentVersion?.body ?? slot?.currentVersion?.body ?? null;

  const isContentLoading = hasArtifact && isItemPending && !body && !isError;

  if (isInitialLoad) {
    return (
      <div className={DOCUMENT_PAGE_SCROLL_CLASS}>
        <div className={DOCUMENT_PAGE_INNER_CLASS}>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={DOCUMENT_PAGE_SCROLL_CLASS}>
        <DocumentPageGrid className={DOCUMENT_PAGE_INNER_CLASS}>
          <DocumentPageHeader
            eyebrow={`${DOCUMENT_TYPE_SHORT[documentType]} section`}
            title={label}
            description={description}
            status="This section could not be loaded"
            icon={Icon}
          />
          <DocumentPageMainColumn>
            <div className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center">
              <p className="text-sm text-destructive">
                {error instanceof Error
                  ? error.message
                  : "Failed to load section."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            </div>
          </DocumentPageMainColumn>
        </DocumentPageGrid>
      </div>
    );
  }

  const headerStatus = !hasArtifact
    ? "Not started — use the agent workbench to draft this section"
    : undefined;
  const headerMeta =
    hasArtifact &&
    (status || item?.priority || typeof item?.confidence === "number") ? (
      <>
        {status ? (
          <Badge
            variant="outline"
            className={cn("text-xs", STATUS_CLASS[status])}
          >
            {STATUS_LABELS[status]}
          </Badge>
        ) : null}
        {item?.priority ? (
          <Badge variant="outline" className="text-xs">
            {PRIORITY_LABELS[item.priority as ArtifactPriority]}
          </Badge>
        ) : null}
        {typeof item?.confidence === "number" ? (
          <Badge variant="outline" className="text-xs">
            Confidence {Math.round(item.confidence)}%
          </Badge>
        ) : null}
      </>
    ) : null;

  return (
    <div className={DOCUMENT_PAGE_SCROLL_CLASS}>
      <DocumentPageGrid className={cn(DOCUMENT_PAGE_INNER_CLASS, "gap-y-5")}>
        <DocumentPageHeader
          eyebrow={`${DOCUMENT_TYPE_SHORT[documentType]} section`}
          title={label}
          description={description}
          status={headerStatus}
          meta={headerMeta}
          icon={Icon}
        />

        {!hasArtifact || !body ? (
          <DocumentPageMainColumn>
            <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/15 px-6 py-16 text-center">
              <PenLine
                className="size-8 text-muted-foreground/70"
                aria-hidden
              />
              <p className="mt-4 max-w-md text-pretty text-sm text-muted-foreground">
                This section has no content yet. Open the agent workbench on
                the right to start drafting, or approve an agent proposal to
                populate this section.
              </p>
            </div>
          </DocumentPageMainColumn>
        ) : isContentLoading ? (
          <DocumentPageMainColumn>
            <div
              className="space-y-3"
              aria-busy="true"
              aria-label="Loading section content"
            >
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </DocumentPageMainColumn>
        ) : (
          <DocumentPageMainColumn>
            <article className="w-full">
              <MarkdownContent content={body} variant="document" />
            </article>
          </DocumentPageMainColumn>
        )}

        {item && item.versions.length > 1 ? (
          <DocumentPageMainColumn>
            <section className="w-full space-y-3 border-t border-border/55 pt-5">
              <h2 className="text-sm font-semibold text-foreground">
                Version history
              </h2>
              <ul className="space-y-2">
                {item.versions.map((version) => (
                  <li
                    key={version.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span className="text-foreground">
                      v{version.versionNumber ?? "?"}
                      {version.title ? ` — ${version.title}` : ""}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(version.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </DocumentPageMainColumn>
        ) : null}
      </DocumentPageGrid>
    </div>
  );
}
