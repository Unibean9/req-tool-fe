"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  LayoutDashboard,
  TriangleAlert,
  Users,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  prefetchDocumentItem,
  useDocument,
  useDocumentTypes,
} from "@/hooks/useDocument";
import {
  DOCUMENT_TYPE_SHORT,
  getDocumentContainerIcon,
  getDocumentItemIcon,
} from "@/lib/document/documentItemIcons";
import type {
  DocumentRegistryEntry,
  DocumentType,
} from "@/lib/api/services/fetchDocument";
import { cn } from "@/lib/utils";

import { useDocumentContainerLock } from "@/hooks/useDocumentContainerLock";
import {
  buildDocumentSectionLockMap,
  getPriorRegistryContainer,
  isDocumentSectionAccepted,
} from "@/lib/document/documentSectionLock";

// ─── Sub-components ───────────────────────────────────────────────────────────

const SIDEBAR_CHILDREN_CLOSE_MS = 180;
const SIDEBAR_CHILDREN_OPEN_MS = 220;

function useDisclosurePresence(open: boolean, animate: boolean): boolean {
  const [isPresent, setIsPresent] = useState(open);

  useEffect(() => {
    if (open) {
      const frame = window.requestAnimationFrame(() => {
        setIsPresent(true);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const timeout = window.setTimeout(
      () => {
        setIsPresent(false);
      },
      animate ? SIDEBAR_CHILDREN_CLOSE_MS : 0,
    );

    return () => window.clearTimeout(timeout);
  }, [animate, open]);

  return isPresent;
}

type DocumentChildrenRevealState = {
  armedScope: string | null;
};

type DocumentChildrenRevealAction =
  | { type: "document_unknown" }
  | { type: "document_unstarted"; scopeKey: string }
  | { type: "document_started_mismatch" }
  | { type: "animation_complete"; scopeKey: string };

function documentChildrenRevealReducer(
  state: DocumentChildrenRevealState,
  action: DocumentChildrenRevealAction,
): DocumentChildrenRevealState {
  switch (action.type) {
    case "document_unknown":
      return state.armedScope === null ? state : { armedScope: null };
    case "document_unstarted":
      return state.armedScope === action.scopeKey
        ? state
        : { armedScope: action.scopeKey };
    case "document_started_mismatch":
      return state.armedScope === null ? state : { armedScope: null };
    case "animation_complete":
      return state.armedScope === action.scopeKey
        ? { armedScope: null }
        : state;
    default:
      return state;
  }
}

function useDocumentChildrenRevealMotion({
  scopeKey,
  documentKnown,
  documentStarted,
}: {
  scopeKey: string;
  documentKnown: boolean;
  documentStarted: boolean;
}): boolean {
  const [{ armedScope }, dispatch] = useReducer(documentChildrenRevealReducer, {
    armedScope: null,
  });

  const shouldAnimateReveal = documentStarted && armedScope === scopeKey;

  useEffect(() => {
    if (!documentKnown) {
      if (armedScope === null) return;

      const frame = window.requestAnimationFrame(() => {
        dispatch({ type: "document_unknown" });
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (!documentStarted) {
      if (armedScope === scopeKey) return;

      const frame = window.requestAnimationFrame(() => {
        dispatch({ type: "document_unstarted", scopeKey });
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (armedScope !== scopeKey) {
      if (armedScope === null) return;

      const frame = window.requestAnimationFrame(() => {
        dispatch({ type: "document_started_mismatch" });
      });

      return () => window.cancelAnimationFrame(frame);
    }

    const timeout = window.setTimeout(() => {
      dispatch({ type: "animation_complete", scopeKey });
    }, SIDEBAR_CHILDREN_OPEN_MS);

    return () => window.clearTimeout(timeout);
  }, [armedScope, documentKnown, documentStarted, scopeKey]);

  return shouldAnimateReveal;
}

function SidebarSectionTitle({
  children,
  withDivider = false,
  action,
}: {
  children: string;
  withDivider?: boolean;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "px-1",
        withDivider && "mt-1 border-t border-border/70 pt-3",
      )}
    >
      <div className="flex min-h-8 items-center gap-2 px-1 pb-2">
        <h2 className="flex min-w-0 items-center gap-2 text-xs font-bold tracking-wide text-foreground/95 uppercase">
          <span
            className="h-3.5 w-0.5 shrink-0 rounded-full bg-brand-mint/90 shadow-[0_0_6px_color-mix(in_oklab,var(--brand-mint)_50%,transparent)]"
            aria-hidden
          />
          <span className="truncate leading-snug">{children}</span>
        </h2>
        {action ? <div className="ml-auto shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

function SidebarNavLink({
  href,
  label,
  icon: Icon,
  active,
  trailing,
  nested = false,
  title,
  onPrefetch,
  disabled = false,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  trailing?: ReactNode;
  nested?: boolean;
  title?: string;
  onPrefetch?: () => void;
  disabled?: boolean;
}) {
  const className = cn(
    "flex min-h-11 min-w-0 items-center gap-2 rounded-lg py-2 text-left transition-[color,background-color,border-color] duration-200 outline-none",
    disabled
      ? "cursor-not-allowed"
      : "focus-visible:ring-2 focus-visible:ring-ring/45",
    nested
      ? cn(
          "overflow-hidden px-2 text-[0.8125rem]",
          !disabled &&
            (active
              ? "bg-(--chart-1)/10 font-medium text-foreground ring-1 ring-inset ring-primary/30"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"),
        )
      : cn(
          "border border-transparent bg-transparent px-2.5 text-sm",
          !disabled &&
            (active
              ? "border-primary/30 bg-(--chart-1)/10 font-medium text-foreground"
              : "text-muted-foreground hover:border-border/50 hover:bg-muted/50 hover:text-foreground"),
        ),
    disabled && "pointer-events-none opacity-45",
  );

  const content = (
    <>
      <Icon
        className={cn("shrink-0 opacity-85", nested ? "size-3.5" : "size-4")}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing ? (
        <span className="flex shrink-0 items-center pl-1.5">{trailing}</span>
      ) : null}
    </>
  );

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        title={title ?? "Coming soon"}
        className={className}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      title={title ?? label}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      className={className}
    >
      {content}
    </Link>
  );
}

function SidebarIcon({
  icon: Icon,
  className,
}: {
  icon: typeof LayoutDashboard;
  className?: string;
}) {
  return <Icon className={className} aria-hidden />;
}

function pathExact(pathname: string, href: string): boolean {
  const p = pathname.split("?")[0] ?? "";
  const normalized = href.endsWith("/") ? href.slice(0, -1) : href;
  return p === normalized || p === `${normalized}/`;
}

function pathActive(pathname: string, prefix: string): boolean {
  const p = pathname.split("?")[0] ?? "";
  if (!prefix.endsWith("/") && p === prefix) return true;
  return p === prefix || p.startsWith(`${prefix}/`);
}

function DocumentContainerNav({
  orgSlug,
  projectSlug,
  projectId,
  container,
  priorContainer,
  registryItems,
  pathname,
  withDivider,
  exportAction,
}: {
  orgSlug: string;
  projectSlug: string;
  projectId: string | null;
  container: DocumentRegistryEntry;
  priorContainer: DocumentRegistryEntry | null;
  registryItems: DocumentRegistryEntry[];
  pathname: string;
  withDivider?: boolean;
  exportAction?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const documentType = container.artifactType as DocumentType;
  const base = `/${encodeURIComponent(orgSlug)}/projects/${encodeURIComponent(projectSlug)}`;
  const documentHref = `${base}/documents/${documentType}`;
  const ContainerIcon = getDocumentContainerIcon(documentType);

  const containerLock = useDocumentContainerLock(
    projectId,
    documentType,
    priorContainer,
  );

  const prefetchItem = useCallback(
    (itemType: string) => {
      if (!projectId) return;
      prefetchDocumentItem(queryClient, projectId, documentType, itemType);
    },
    [documentType, projectId, queryClient],
  );

  const { data: document, isPending } = useDocument(projectId, documentType, {
    enabled: Boolean(projectId),
  });

  const label = document?.label ?? container.label;
  const items = useMemo(() => {
    if (document?.items.length) return document.items;
    return container.children.map((itemType) => {
      const meta = registryItems.find(
        (entry) => entry.artifactType === itemType,
      );
      return {
        artifactType: itemType,
        label: meta?.label ?? itemType.replace(/_/g, " "),
        description: meta?.description ?? "",
        artifactId: null,
        parentId: null,
        status: null,
        title: null,
        currentVersionId: null,
        currentVersion: null,
        versions: [],
      };
    });
  }, [container.children, document?.items, registryItems]);

  const acceptedCount = items.filter((item) =>
    isDocumentSectionAccepted(item),
  ).length;
  const totalCount = items.length;
  const isOverviewActive = pathExact(pathname, documentHref);
  const isInDocument = pathActive(pathname, documentHref);
  const isChildActive = isInDocument && !isOverviewActive;
  const documentStarted = Boolean(document?.artifactId);
  const shouldShowChildren =
    totalCount > 0 && (documentStarted || isChildActive);
  const shouldAnimateChildrenReveal = useDocumentChildrenRevealMotion({
    scopeKey: `${projectId ?? "no-project"}:${documentType}`,
    documentKnown: Boolean(document),
    documentStarted,
  });
  const isChildrenPresent = useDisclosurePresence(
    shouldShowChildren,
    shouldAnimateChildrenReveal,
  );
  const childNavId = `document-${documentType}-sections`;
  const childMotion = shouldAnimateChildrenReveal ? "animate" : "instant";
  const sectionLockByType = useMemo(
    () =>
      buildDocumentSectionLockMap(
        container.children,
        items,
        documentType,
        containerLock,
      ),
    [container.children, containerLock, documentType, items],
  );

  return (
    <div
      className={cn(
        "min-w-0 shrink-0 space-y-0.5",
        withDivider && "mt-1 border-t border-border/70 pt-3",
      )}
    >
      <SidebarSectionTitle action={exportAction}>
        {DOCUMENT_TYPE_SHORT[documentType]}
      </SidebarSectionTitle>

      <div className="px-0.5">
        <Link
          href={documentHref}
          title={label}
          aria-current={
            isOverviewActive ? "page" : isChildActive ? "true" : undefined
          }
          aria-expanded={totalCount > 0 ? shouldShowChildren : undefined}
          aria-controls={shouldShowChildren ? childNavId : undefined}
          className={cn(
            "flex min-h-11 min-w-0 items-center gap-2 rounded-lg overflow-hidden px-2.5 py-2 text-left text-sm transition-[color,background-color,box-shadow] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring/45",
            isOverviewActive
              ? "border border-primary/30 bg-(--chart-1)/10 font-medium text-foreground"
              : isChildActive
                ? "bg-muted/30 font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
        >
          <SidebarIcon
            icon={ContainerIcon}
            className={cn(
              "size-4 shrink-0",
              isOverviewActive ? "text-brand-mint opacity-100" : "opacity-85",
            )}
          />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {totalCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 pl-1.5">
              <span
                className={cn(
                  "text-[0.625rem] tabular-nums",
                  isChildActive
                    ? "text-foreground/80"
                    : "text-muted-foreground",
                )}
              >
                {acceptedCount}/{totalCount}
              </span>
              <ChevronRight
                className={cn(
                  "size-3 text-muted-foreground/70 transition-transform duration-200 motion-reduce:transition-none",
                  shouldShowChildren && "rotate-90 text-brand-mint/80",
                )}
                aria-hidden
              />
            </span>
          ) : null}
        </Link>
      </div>

      {isChildrenPresent ? (
        <div
          className="deliverables-section-children"
          data-open={shouldShowChildren ? "true" : "false"}
          data-motion={childMotion}
          aria-hidden={!shouldShowChildren}
          inert={shouldShowChildren ? undefined : true}
        >
          <nav
            id={childNavId}
            className="t-panel-slide ml-1.5 min-h-0 min-w-0 space-y-0.5 border-l border-border/40 pl-1.5"
            data-open={shouldShowChildren ? "true" : "false"}
            data-motion={childMotion}
            aria-label={`${label} sections`}
          >
            {isPending && !document ? (
              <div className="space-y-1 py-0.5">
                <Skeleton className="h-8 rounded-lg" />
                <Skeleton className="h-8 rounded-lg" />
              </div>
            ) : (
              items.map((item) => {
                const href = `${documentHref}/${item.artifactType}`;
                const Icon = getDocumentItemIcon(item.artifactType);
                const accepted = isDocumentSectionAccepted(item);
                const lock = sectionLockByType.get(item.artifactType);
                const hasSectionWarning = lock?.hasPendingPrerequisite === true;

                return (
                  <SidebarNavLink
                    key={item.artifactType}
                    href={href}
                    label={item.label}
                    icon={Icon}
                    nested
                    active={pathActive(pathname, href)}
                    title={
                      hasSectionWarning && lock?.prerequisiteLabel
                        ? `${item.label} — ${lock.prerequisiteLabel} not completed yet`
                        : undefined
                    }
                    onPrefetch={
                      item.artifactId
                        ? () => prefetchItem(item.artifactType)
                        : undefined
                    }
                    trailing={
                      hasSectionWarning ? (
                        <TriangleAlert
                          className="size-3.5 text-amber-500"
                          aria-label={`${lock?.prerequisiteLabel ?? "Previous section"} not completed yet`}
                        />
                      ) : accepted ? (
                        <CheckCircle2
                          className="size-3.5 text-primary"
                          aria-label="Accepted"
                        />
                      ) : item.artifactId ? (
                        <Circle
                          className="size-3.5 text-muted-foreground/40"
                          aria-hidden
                        />
                      ) : null
                    }
                  />
                );
              })
            )}
          </nav>
        </div>
      ) : null}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DeliverablesSidebarContent({
  orgSlug,
  projectSlug,
  projectId,
}: {
  orgSlug: string;
  projectSlug: string;
  projectId: string | null;
}) {
  const pathname = usePathname() ?? "";
  const encOrg = encodeURIComponent(orgSlug);
  const encProj = encodeURIComponent(projectSlug);
  const base = `/${encOrg}/projects/${encProj}`;

  const nav = useMemo(
    () => ({
      dashboard: `${base}/dashboard`,
      members: `${base}/members`,
    }),
    [base],
  );

  const { data: registry, isPending: isRegistryPending } = useDocumentTypes();
  const containers = registry?.containers ?? [];
  const registryItems = registry?.items ?? [];

  return (
    <>
      <div className="min-w-0 shrink-0 space-y-1">
        <SidebarSectionTitle>Overview</SidebarSectionTitle>
        <div className="space-y-1 px-0.5">
          <SidebarNavLink
            href={nav.members}
            label="Members"
            icon={Users}
            active={pathActive(pathname, nav.members)}
          />
          <SidebarNavLink
            href={nav.dashboard}
            label="Project Overview"
            icon={LayoutDashboard}
            active={pathActive(pathname, nav.dashboard)}
          />
        </div>
      </div>

      {isRegistryPending && !registry ? (
        <div className="mt-1 space-y-2 border-t border-border/70 px-1 pt-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 rounded-lg" />
          <Skeleton className="ml-2 h-8 rounded-lg border-l border-border/40 pl-2" />
          <Skeleton className="ml-2 h-8 rounded-lg border-l border-border/40 pl-2" />
        </div>
      ) : (
        containers.map((container) => (
          <DocumentContainerNav
            key={container.artifactType}
            orgSlug={orgSlug}
            projectSlug={projectSlug}
            projectId={projectId}
            container={container}
            priorContainer={getPriorRegistryContainer(
              containers,
              container.artifactType,
            )}
            registryItems={registryItems}
            pathname={pathname}
            withDivider
          />
        ))
      )}
    </>
  );
}
