"use client";

import Link from "next/link";
import { createElement } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDocument, useEnsureDocument } from "@/hooks/useDocument";
import {
  DOCUMENT_TYPE_SHORT,
  getDocumentItemIcon,
} from "@/lib/document/documentItemIcons";
import type {
  DocumentItemSlot,
  DocumentType,
} from "@/lib/api/services/fetchDocument";
import { cn } from "@/lib/utils";

import { BrdExportDialog } from "../../components/BrdExportDialog";
import { DocumentPageHeader } from "./documentPageHeader";

type DocumentOverviewPageProps = {
  orgSlug: string;
  projectSlug: string;
  projectId: string | null;
  documentType: DocumentType;
  isProjectsPending: boolean;
};

const DOCUMENT_OVERVIEW_SCROLL_CLASS =
  "flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6 scrollbar-none sm:px-6";

const DOCUMENT_OVERVIEW_INNER_CLASS = "flex w-full flex-col gap-5";

type SectionState = "inProgress" | "accepted" | "notStarted";

function slotStatusLabel(status: string | null, hasArtifact: boolean): string {
  if (!hasArtifact) return "Not started";
  if (status === "accepted") return "Accepted";
  if (status === "draft") return "Draft";
  if (status === "needs_clarification") return "Needs clarification";
  if (status === "rejected") return "Rejected";
  return "In progress";
}

function getSectionState(item: DocumentItemSlot): SectionState {
  if (!item.artifactId) return "notStarted";
  if (item.status === "accepted") return "accepted";
  return "inProgress";
}

function sectionIconTone(id: SectionState): string {
  if (id === "accepted") return "bg-primary/12 text-brand-mint";
  if (id === "inProgress") return "bg-brand-mint/10 text-brand-mint";
  return "bg-muted/45 text-muted-foreground";
}

function sectionPriorityRank(item: DocumentItemSlot): number {
  const state = getSectionState(item);
  if (state === "inProgress") return 0;
  if (state === "notStarted") return 1;
  return 2;
}

function statusBadgeClass(item: DocumentItemSlot): string {
  if (!item.artifactId) {
    return "border-border/70 bg-background/35 text-muted-foreground";
  }
  if (item.status === "accepted") {
    return "border-primary/35 bg-primary/10 text-brand-mint";
  }
  if (item.status === "needs_clarification") {
    return "border-amber-400/35 bg-amber-400/10 text-amber-300";
  }
  if (item.status === "rejected") {
    return "border-destructive/35 bg-destructive/10 text-destructive";
  }
  return "border-brand-mint/30 bg-brand-mint/8 text-brand-mint";
}

function DocumentItemIcon({
  itemType,
  className,
}: {
  itemType: string;
  className?: string;
}) {
  return createElement(getDocumentItemIcon(itemType), {
    className,
    "aria-hidden": true,
  });
}

function DocumentCommandCenter({
  acceptedCount,
  inProgressCount,
  notStartedCount,
  totalSlots,
  nextFocusItem,
  base,
}: {
  acceptedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  totalSlots: number;
  nextFocusItem: DocumentItemSlot | null;
  base: string;
}) {
  const completionPercent = totalSlots
    ? Math.round((acceptedCount / totalSlots) * 100)
    : 0;
  const isComplete = totalSlots > 0 && acceptedCount === totalSlots;
  const nextFocusHref = nextFocusItem
    ? `${base}/${nextFocusItem.artifactType}`
    : null;

  return (
    <section
      className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]"
      aria-label="Document command center"
    >
      <div className="rounded-xl border border-border/60 bg-card/38 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Document command center
            </p>
            <p className="mt-1 max-w-2xl text-pretty text-xs leading-5 text-muted-foreground">
              Track acceptance, spot the next section to move, and keep the BRD
              package from feeling like seven identical cards.
            </p>
          </div>

          <div className="md:text-right">
            <p className="text-sm font-semibold text-foreground tabular-nums">
              {completionPercent}% accepted
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedCount} of {totalSlots} sections
            </p>
          </div>
        </div>

        <div
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Document completion: ${completionPercent}% accepted`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${completionPercent}%` }}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-primary/20 bg-primary/6 px-3 py-2">
            <p className="text-xs text-muted-foreground">Accepted</p>
            <p className="mt-0.5 text-lg font-semibold text-brand-mint tabular-nums">
              {acceptedCount}
            </p>
          </div>
          <div className="rounded-lg border border-brand-mint/20 bg-brand-mint/6 px-3 py-2">
            <p className="text-xs text-muted-foreground">In motion</p>
            <p className="mt-0.5 text-lg font-semibold text-foreground tabular-nums">
              {inProgressCount}
            </p>
          </div>
          <div className="rounded-lg border border-border/55 bg-background/25 px-3 py-2">
            <p className="text-xs text-muted-foreground">Backlog</p>
            <p className="mt-0.5 text-lg font-semibold text-foreground tabular-nums">
              {notStartedCount}
            </p>
          </div>
        </div>
      </div>

      {nextFocusItem && nextFocusHref ? (
        <Link
          href={nextFocusHref}
          className="group flex min-h-43 flex-col justify-between rounded-xl border border-brand-mint/25 bg-card/50 p-4 outline-none transition-[border-color,background-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-brand-mint/45 hover:bg-card/70 focus-visible:ring-2 focus-visible:ring-ring/45 motion-reduce:transform-none"
        >
          <div className="flex items-start gap-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-mint/10 text-brand-mint"
              aria-hidden
            >
              <DocumentItemIcon
                itemType={nextFocusItem.artifactType}
                className="size-4"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-brand-mint">Next focus</p>
              <h2 className="mt-1 text-balance text-sm font-semibold text-foreground">
                {nextFocusItem.label}
              </h2>
              <p className="mt-1 line-clamp-3 text-pretty text-xs leading-5 text-muted-foreground">
                {nextFocusItem.description}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-[0.6875rem]",
                statusBadgeClass(nextFocusItem),
              )}
            >
              {slotStatusLabel(
                nextFocusItem.status,
                Boolean(nextFocusItem.artifactId),
              )}
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-foreground/80">
              Open section
              <ArrowRight
                className="size-3 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
                aria-hidden
              />
            </span>
          </div>
        </Link>
      ) : (
        <div className="flex min-h-43 flex-col justify-between rounded-xl border border-primary/25 bg-primary/6 p-4">
          <div>
            <p className="text-xs font-medium text-brand-mint">
              {isComplete ? "Ready" : "No focus section"}
            </p>
            <h2 className="mt-1 text-balance text-sm font-semibold text-foreground">
              {isComplete
                ? "Every section is accepted"
                : "No section needs attention right now"}
            </h2>
            <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
              {isComplete
                ? "The BRD package is in a stable state for review or export."
                : "When a draft or backlog item appears, it will be promoted here."}
            </p>
          </div>
          <CheckCircle2 className="size-5 text-primary" aria-hidden />
        </div>
      )}
    </section>
  );
}

function DocumentSectionCard({
  item,
  href,
}: {
  item: DocumentItemSlot;
  href: string;
}) {
  const state = getSectionState(item);
  const status = slotStatusLabel(item.status, Boolean(item.artifactId));
  const isAccepted = state === "accepted";

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col justify-between rounded-lg border transition-[border-color,background-color,transform] duration-200 ease-out",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring/45",
        "hover:-translate-y-0.5 hover:bg-card/65 motion-reduce:transform-none",
        isAccepted ? "min-h-24 p-3" : "min-h-32 p-4",
        state === "accepted"
          ? "border-primary/18 bg-background/25 hover:border-primary/30"
          : state === "inProgress"
            ? "border-brand-mint/25 bg-card/42 hover:border-brand-mint/45"
            : "border-border/50 bg-background/20 hover:border-border/80",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            sectionIconTone(state),
          )}
          aria-hidden
        >
          <DocumentItemIcon itemType={item.artifactType} className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-5 text-foreground">
            {item.label}
          </h3>
          <p className="mt-1 line-clamp-2 text-pretty text-xs leading-5 text-muted-foreground">
            {item.description}
          </p>
        </div>
        {state === "accepted" ? (
          <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
        ) : state === "inProgress" ? (
          <Clock3 className="size-4 shrink-0 text-brand-mint/80" aria-hidden />
        ) : (
          <Circle
            className="size-4 shrink-0 text-muted-foreground/50"
            aria-hidden
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <Badge
          variant="outline"
          className={cn("text-[0.6875rem]", statusBadgeClass(item))}
        >
          {status}
        </Badge>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors duration-200 group-hover:text-foreground/80">
          Open
          <ArrowRight
            className="size-3 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}

function DocumentSectionMatrix({
  items,
  base,
}: {
  items: DocumentItemSlot[];
  base: string;
}) {
  const sortedItems = [...items].sort(
    (a, b) => sectionPriorityRank(a) - sectionPriorityRank(b),
  );

  return (
    <section aria-labelledby="document-section-matrix">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2
            id="document-section-matrix"
            className="text-sm font-semibold text-foreground"
          >
            Section matrix
          </h2>
          <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
            Active and untouched sections rise first; accepted sections compress
            into quieter completion cards.
          </p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {items.length} sections
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sortedItems.map((item) => (
          <DocumentSectionCard
            key={item.artifactType}
            item={item}
            href={`${base}/${item.artifactType}`}
          />
        ))}
      </div>
    </section>
  );
}

export function DocumentOverviewPage({
  orgSlug,
  projectSlug,
  projectId,
  documentType,
  isProjectsPending,
}: DocumentOverviewPageProps) {
  const base = `/${encodeURIComponent(orgSlug)}/projects/${encodeURIComponent(projectSlug)}/documents/${documentType}`;
  const ensureDocument = useEnsureDocument();

  const {
    data: document,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useDocument(projectId, documentType, {
    enabled: Boolean(projectId),
  });

  const isInitialLoad =
    isProjectsPending || !projectId || (isPending && !document);

  const acceptedCount =
    document?.items.filter((item) => item.status === "accepted").length ?? 0;
  const totalSlots = document?.items.length ?? 0;

  if (isInitialLoad) {
    return (
      <div className={DOCUMENT_OVERVIEW_SCROLL_CLASS}>
        <div className={DOCUMENT_OVERVIEW_INNER_CLASS}>
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={DOCUMENT_OVERVIEW_SCROLL_CLASS}>
        <div className={DOCUMENT_OVERVIEW_INNER_CLASS}>
          <DocumentPageHeader
            eyebrow={DOCUMENT_TYPE_SHORT[documentType]}
            title="Document overview"
            status="Could not load document"
          />
          <div className="rounded-xl border border-border/70 bg-card/50 px-5 py-8 text-center">
            <p className="text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to load document."}
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
        </div>
      </div>
    );
  }

  if (!document?.artifactId) {
    return (
      <div className={DOCUMENT_OVERVIEW_SCROLL_CLASS}>
        <div className={DOCUMENT_OVERVIEW_INNER_CLASS}>
          <DocumentPageHeader
            eyebrow={DOCUMENT_TYPE_SHORT[documentType]}
            title={document?.label ?? DOCUMENT_TYPE_SHORT[documentType]}
            description={document?.description}
            status="Document container has not been created yet"
          />
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-center">
            <p className="text-pretty text-sm text-muted-foreground">
              Create the document container to unlock all sections and start
              drafting with the agent.
            </p>
            <Button
              type="button"
              className="mt-4"
              disabled={!projectId || ensureDocument.isPending}
              onClick={() => {
                if (!projectId) return;
                ensureDocument.mutate({ projectId, documentType });
              }}
            >
              {ensureDocument.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Create {DOCUMENT_TYPE_SHORT[documentType]}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const inProgressItems = document.items.filter(
    (item) => getSectionState(item) === "inProgress",
  );
  const acceptedItems = document.items.filter(
    (item) => getSectionState(item) === "accepted",
  );
  const notStartedItems = document.items.filter(
    (item) => getSectionState(item) === "notStarted",
  );
  const nextFocusItem = inProgressItems[0] ?? notStartedItems[0] ?? null;

  return (
    <div className={DOCUMENT_OVERVIEW_SCROLL_CLASS}>
      <div className={DOCUMENT_OVERVIEW_INNER_CLASS}>
        <DocumentPageHeader
          eyebrow={DOCUMENT_TYPE_SHORT[documentType]}
          title={document.label}
          description={document.description}
          status={`${acceptedCount} of ${totalSlots} sections accepted`}
          action={
            documentType === "brd" ? (
              <BrdExportDialog
                projectId={projectId}
                projectSlug={projectSlug}
                trigger="button"
              />
            ) : undefined
          }
        />

        <DocumentCommandCenter
          acceptedCount={acceptedItems.length}
          inProgressCount={inProgressItems.length}
          notStartedCount={notStartedItems.length}
          totalSlots={totalSlots}
          nextFocusItem={nextFocusItem}
          base={base}
        />

        {isFetching && !isPending ? (
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Refreshing…
          </p>
        ) : null}

        <DocumentSectionMatrix items={document.items} base={base} />
      </div>
    </div>
  );
}
