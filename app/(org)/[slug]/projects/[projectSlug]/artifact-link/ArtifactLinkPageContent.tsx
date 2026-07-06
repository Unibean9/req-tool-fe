"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  CircleDot,
  GitBranch,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectArtifactGraph } from "@/hooks/useArtifact";
import type {
  ArtifactGraphEdge,
  ArtifactGraphNode,
  ArtifactLifecycleState,
  ArtifactStatus,
} from "@/lib/api/services/fetchArtifact";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<ArtifactStatus, string> = {
  draft: "border-border/70 bg-muted text-muted-foreground",
  needs_clarification:
    "border-amber-400/30 bg-amber-400/10 text-amber-200",
  accepted: "border-primary/35 bg-primary/15 text-brand-mint",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  archived: "border-border/70 bg-muted/70 text-foreground",
};

const STATUS_LABELS: Record<ArtifactStatus, string> = {
  draft: "Draft",
  needs_clarification: "Needs Clarification",
  accepted: "Accepted",
  rejected: "Rejected",
  archived: "Archived",
};

const LIFECYCLE_CLASS: Record<ArtifactLifecycleState, string> = {
  missing: "border-border/70 bg-muted text-muted-foreground",
  blocked: "border-destructive/30 bg-destructive/10 text-destructive",
  in_progress: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  current: "border-primary/35 bg-primary/15 text-brand-mint",
  stale: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  orphan: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200",
};

const LIFECYCLE_LABELS: Record<ArtifactLifecycleState, string> = {
  missing: "Missing",
  blocked: "Blocked",
  in_progress: "In Progress",
  current: "Current",
  stale: "Stale",
  orphan: "Orphan",
};

function formatToken(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortId(value: string): string {
  return value.length > 12 ? value.slice(0, 8) : value;
}

function LifecycleBadge({
  state,
  reason,
}: {
  state: ArtifactLifecycleState | null;
  reason?: string | null;
}) {
  if (!state) return null;
  return (
    <Badge
      variant="outline"
      className={cn(LIFECYCLE_CLASS[state])}
      title={reason ?? undefined}
    >
      {LIFECYCLE_LABELS[state]}
    </Badge>
  );
}

function StatusBadge({ status }: { status: ArtifactStatus | null }) {
  if (!status) return null;
  return (
    <Badge variant="outline" className={cn(STATUS_CLASS[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof GitBranch;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-border/65 bg-card/35 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 shrink-0 text-primary" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function NodeRow({
  node,
  artifactHref,
}: {
  node: ArtifactGraphNode;
  artifactHref: string | null;
}) {
  return (
    <article className="rounded-lg border border-border/65 bg-card/35 px-4 py-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {node.code ? (
              <Badge variant="outline" className="font-mono font-medium">
                {node.code}
              </Badge>
            ) : null}
            <h3 className="min-w-0 text-pretty text-sm font-semibold leading-5 text-foreground">
              {node.title}
            </h3>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {node.type ? (
              <Badge variant="outline">{formatToken(node.type)}</Badge>
            ) : null}
            <StatusBadge status={node.status} />
            <LifecycleBadge
              state={node.lifecycleState}
              reason={node.lifecycleReason}
            />
          </div>
        </div>
        {artifactHref ? (
          <Button
            render={<Link href={artifactHref} />}
            variant="outline"
            size="sm"
            className="shrink-0"
          >
            Open
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Button>
        ) : null}
      </div>
      <code className="mt-3 block truncate rounded-md bg-muted/35 px-2 py-1.5 font-mono text-[0.6875rem] text-muted-foreground">
        {node.artifactId}
      </code>
    </article>
  );
}

function EdgeRow({
  edge,
  nodeById,
}: {
  edge: ArtifactGraphEdge;
  nodeById: Map<string, ArtifactGraphNode>;
}) {
  const source = nodeById.get(edge.source);
  const target = nodeById.get(edge.target);

  return (
    <li className="rounded-lg border border-border/60 bg-muted/20 px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">
          {source?.title ?? shortId(edge.source)}
        </span>
        <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">
          {target?.title ?? shortId(edge.target)}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {edge.relationType ? formatToken(edge.relationType) : "Related"}
      </p>
    </li>
  );
}

export function ArtifactLinkPageContent({
  projectId,
  orgSlug,
  projectSlug,
}: {
  projectId: string | null;
  orgSlug: string;
  projectSlug: string;
}) {
  const {
    data: graph,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useProjectArtifactGraph(projectId, {
    enabled: Boolean(projectId),
  });

  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  const archivedCount = nodes.filter((node) => node.status === "archived").length;
  const issueCount = nodes.filter(
    (node) =>
      node.lifecycleState === "blocked" ||
      node.lifecycleState === "stale" ||
      node.lifecycleState === "orphan"
  ).length;
  const nodeById = new Map(nodes.map((node) => [node.artifactId, node]));
  const baseHref = `/${encodeURIComponent(orgSlug)}/projects/${encodeURIComponent(projectSlug)}`;

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Select a project to inspect artifact links.
        </p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="max-w-md rounded-lg border border-destructive/25 bg-destructive/8 px-5 py-4 text-center">
          <AlertTriangle className="mx-auto size-5 text-destructive" aria-hidden />
          <p className="mt-3 text-sm font-medium text-foreground">
            Could not load artifact graph
          </p>
          <p className="mt-1 text-pretty text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Try again in a moment."}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="mt-4"
          >
            <RefreshCw
              data-icon="inline-start"
              className={cn(isFetching && "animate-spin")}
              aria-hidden
            />
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Lifecycle graph
          </p>
          <h1 className="mt-1 text-balance font-heading text-2xl font-semibold text-foreground">
            Artifact links
          </h1>
          <p className="mt-1 max-w-2xl text-pretty text-sm leading-6 text-muted-foreground">
            Inspect artifact relationships, archived nodes, and lifecycle
            resolver states from the project graph.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            data-icon="inline-start"
            className={cn(isFetching && "animate-spin")}
            aria-hidden
          />
          Refresh
        </Button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Artifacts" value={nodes.length} icon={CircleDot} />
        <Stat label="Links" value={edges.length} icon={GitBranch} />
        <Stat label="Archived" value={archivedCount} icon={Archive} />
        <Stat label="Lifecycle issues" value={issueCount} icon={AlertTriangle} />
      </section>

      <section className="grid min-h-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              Graph nodes
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {nodes.length.toLocaleString()}
            </span>
          </div>
          {nodes.length ? (
            <div className="grid gap-3">
              {nodes.map((node) => (
                <NodeRow
                  key={node.id}
                  node={node}
                  artifactHref={
                    node.type ? `${baseHref}/artifacts/${node.type}` : null
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border/65 bg-muted/20 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No graph nodes yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Artifact nodes will appear after the project has artifacts.
              </p>
            </div>
          )}
        </div>

        <aside className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              Relationships
            </h2>
            <span className="text-xs tabular-nums text-muted-foreground">
              {edges.length.toLocaleString()}
            </span>
          </div>
          {edges.length ? (
            <ul className="grid gap-2">
              {edges.map((edge) => (
                <EdgeRow key={edge.id} edge={edge} nodeById={nodeById} />
              ))}
            </ul>
          ) : (
            <div className="rounded-lg border border-border/65 bg-muted/20 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                No relationships yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Agent-approved links will be listed here.
              </p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
