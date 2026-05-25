"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { OrgMember } from "@/lib/api/services/fetchUser";
import {
  Background,
  defaultReactFlowCanvasProps,
  FitViewOnGraphChange,
  reactFlowBackgroundProps,
  reactFlowCanvasClassName,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Node,
} from "@/components/ui/react-flow";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgMembers } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

import { useOrgWorkspace } from "../../orgWorkspaceContext";

import { buildOrgMembersFlowGraph } from "./membersFlowGraph";
import { MemberHeader } from "./memberHeader";
import {
  OrgGroupBadge,
  OrgMemberCard,
  OrgOwnerCard,
} from "./membersFlowNodes";
import { OrgMembersSidePanel } from "./membersSidePanel";

const membersPageOuterClassName =
  "flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8";

const membersShellClassName =
  "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl";

const ORG_MEMBERS_NODE_POS_KEY = "req-tool:org-members-flow:node-positions:";

function orgMembersNodePositionsKey(orgId: string) {
  return `${ORG_MEMBERS_NODE_POS_KEY}${orgId}`;
}

function readOrgMembersStoredPositions(
  orgId: string
): Record<string, { x: number; y: number }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(orgMembersNodePositionsKey(orgId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, { x: number; y: number }> = {};
    for (const [id, val] of Object.entries(parsed)) {
      if (
        val &&
        typeof val === "object" &&
        "x" in val &&
        "y" in val &&
        typeof (val as { x: unknown }).x === "number" &&
        typeof (val as { y: unknown }).y === "number"
      ) {
        out[id] = { x: (val as { x: number }).x, y: (val as { y: number }).y };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function mergeStoredNodePositions(nodes: Node[], stored: Record<string, { x: number; y: number }>) {
  return nodes.map((n) => {
    const p = stored[n.id];
    return p ? { ...n, position: { x: p.x, y: p.y } } : n;
  });
}

function persistOrgMembersNodePositions(orgId: string, nodes: Node[]) {
  if (typeof window === "undefined") return;
  const payload: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) {
    payload[n.id] = { x: n.position.x, y: n.position.y };
  }
  try {
    localStorage.setItem(
      orgMembersNodePositionsKey(orgId),
      JSON.stringify(payload)
    );
  } catch {
    /* quota / private mode */
  }
}

function OrgMembersFlowInner({
  orgId,
  ownerId,
  members,
}: {
  orgId: string;
  ownerId: string | null;
  members: OrgMember[];
}) {
  const nodeTypes = useMemo(
    () => ({
      orgOwner: OrgOwnerCard,
      orgMember: OrgMemberCard,
      orgGroup: OrgGroupBadge,
    }),
    []
  );

  const graphKey = useMemo(
    () =>
      `${orgId}:${ownerId ?? "none"}:${members.map((m) => `${m.userId}:${m.role}`).join("|")}`,
    [orgId, ownerId, members]
  );

  const { nodes: layoutNodes, edges } = useMemo(
    () => buildOrgMembersFlowGraph(ownerId, members),
    [ownerId, members]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const nodesRef = useRef(nodes);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useLayoutEffect(() => {
    const { nodes: built } = buildOrgMembersFlowGraph(ownerId, members);
    const stored = readOrgMembersStoredPositions(orgId);
    setNodes(mergeStoredNodePositions(built, stored));
    // graphKey = orgId + membership — only reset layout when the structure changes, not when refetching the same data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphKey, setNodes]);

  const onNodeDragStop = useCallback(() => {
    persistOrgMembersNodePositions(orgId, nodesRef.current);
  }, [orgId]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeDragStop={onNodeDragStop}
      {...defaultReactFlowCanvasProps}
      nodesDraggable
      className={cn(
        reactFlowCanvasClassName,
        "h-full min-h-0 [&_.react-flow__attribution]:hidden"
      )}
    >
      <Background {...reactFlowBackgroundProps} />
      <FitViewOnGraphChange graphKey={graphKey} />
    </ReactFlow>
  );
}

export function OrgMembersFlow({
  orgId,
  ownerId,
  members,
  className,
}: {
  orgId: string;
  ownerId: string | null;
  members: OrgMember[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-full min-h-0 w-full rounded-xl border border-border/80 bg-muted/15 shadow-inner",
        className
      )}
    >
      <ReactFlowProvider>
        <div className="h-full min-h-0 w-full">
          <OrgMembersFlowInner
            orgId={orgId}
            ownerId={ownerId}
            members={members}
          />
        </div>
      </ReactFlowProvider>
    </div>
  );
}

export function Members() {
  const { orgId, orgFromList } = useOrgWorkspace();
  const { data: members, isPending, isError, error, refetch } =
    useOrgMembers(orgId);

  if (isPending) {
    return (
      <div className={membersPageOuterClassName}>
        <MemberHeader />
        <div className={cn(membersShellClassName, "mt-4 min-h-0 flex-1 sm:mt-6")}>
          <Skeleton className="min-h-0 flex-1 rounded-l-none rounded-r-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn(membersPageOuterClassName, "overflow-y-auto")}>
        <MemberHeader />
        <Alert className="mt-4 shrink-0 sm:mt-6" variant="destructive">
          <AlertTitle>Failed to load members</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {error instanceof Error ? error.message : "An error occurred."}
            </span>
            <button
              type="button"
              onClick={() => void refetch()}
              className="shrink-0 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const list = members ?? [];

  return (
    <div className={membersPageOuterClassName}>
      <MemberHeader />
      <div className={cn(membersShellClassName, "mt-4 min-h-0 flex-1 sm:mt-6")}>
        <OrgMembersFlow
          orgId={orgId}
          ownerId={orgFromList.ownerId}
          members={list}
          className="min-h-0 flex-1 rounded-l-none rounded-r-xl"
        />
        <OrgMembersSidePanel orgId={orgId} ownerId={orgFromList.ownerId} />
      </div>
    </div>
  );
}
