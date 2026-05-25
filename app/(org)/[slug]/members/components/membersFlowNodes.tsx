"use client";

import { memo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Handle,
  Position,
  orgChartLayout,
  type Node,
  type NodeProps,
} from "@/components/ui/react-flow";

import { cn } from "@/lib/utils";

import type {
  OrgGroupFlowData,
  OrgMemberFlowData,
  OrgOwnerFlowData,
} from "./membersFlowGraph";

const LC = orgChartLayout;
type OrgOwnerFlowNode = Node<OrgOwnerFlowData, "orgOwner">;
type OrgMemberFlowNode = Node<OrgMemberFlowData, "orgMember">;
type OrgGroupFlowNode = Node<OrgGroupFlowData, "orgGroup">;

/** Team Lead — brand color (chart-1). */
const LEADER_ACCENT = "var(--chart-1)";
/** Member — blue distinct from the leader accent. */
const MEMBER_ACCENT = "rgb(56 189 248)";

function memberCardInitials(
  displayName: string,
  email: string | null,
  userId: string
): string {
  const d = displayName.trim();
  if (d.startsWith("@") && d.length >= 2) {
    const rest = d.slice(1);
    return rest.slice(0, 2).toUpperCase();
  }
  const parts = d.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${(parts[0]![0] ?? "")}${(parts[parts.length - 1]![0] ?? "")}`.toUpperCase();
  }
  if (d.length >= 2) return d.slice(0, 2).toUpperCase();
  const local = (email ?? "").split("@")[0]?.trim();
  if (local && local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local) return local[0]!.toUpperCase();
  return userId.replace(/-/g, "").slice(0, 2).toUpperCase() || "?";
}

const handleClass =
  "!size-2 !border-0 !bg-transparent after:absolute after:inset-[-6px] after:content-['']";

function MemberAvatar({
  userId,
  displayName,
  email,
  avatarUrl,
  borderColor,
}: {
  userId: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  borderColor: string;
}) {
  const initials = memberCardInitials(displayName, email, userId);
  const alt = displayName
    ? `Avatar — ${displayName}`
    : "Member avatar";

  return (
    <div className="absolute -top-7 left-1/2 -translate-x-1/2">
      <Avatar
        className="size-14 border-2 bg-muted shadow-sm"
        style={{ borderColor }}
      >
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={alt} className="rounded-full" />
        ) : null}
        <AvatarFallback className="rounded-full border-0 text-sm font-semibold text-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

export const OrgOwnerCard = memo(function OrgOwnerCard(
  props: NodeProps<OrgOwnerFlowNode>
) {
  const { data } = props;
  const {
    userId,
    synthetic,
    displayName,
    email,
    avatarUrl,
    roleLabel,
  } = data;

  return (
    <div
      className="relative rounded-xl border border-primary/25 bg-card px-3 pb-3 pt-7 text-center shadow-sm"
      style={{ width: LC.cardWidth, minHeight: LC.cardHeight }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-xl"
        style={{ backgroundColor: LEADER_ACCENT }}
        aria-hidden
      />
      <MemberAvatar
        userId={userId}
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
        borderColor={LEADER_ACCENT}
      />
      <p className="mt-2 truncate text-sm font-semibold text-foreground">
        {displayName}
      </p>
      {email ? (
        <p className="truncate text-[11px] text-muted-foreground">{email}</p>
      ) : (
        <p className="truncate text-[11px] text-muted-foreground/70">
          {synthetic ? "No profile" : "—"}
        </p>
      )}
      <p className="mt-0.5 text-xs font-medium text-(--chart-1)">
        {roleLabel}
      </p>
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(handleClass, "bg-primary/50!")}
      />
    </div>
  );
});

export const OrgMemberCard = memo(function OrgMemberCard(
  props: NodeProps<OrgMemberFlowNode>
) {
  const { data } = props;
  const {
    userId,
    displayName,
    email,
    avatarUrl,
    roleLabel,
  } = data;
  const accent = MEMBER_ACCENT;

  return (
    <div
      className="relative rounded-xl border border-sky-500/25 bg-card px-3 pb-3 pt-7 text-center shadow-sm"
      style={{ width: LC.cardWidth, minHeight: LC.cardHeight }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 rounded-t-xl"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <Handle
        type="target"
        position={Position.Top}
        className={cn(handleClass, "bg-muted-foreground/40!")}
      />
      <MemberAvatar
        userId={userId}
        displayName={displayName}
        email={email}
        avatarUrl={avatarUrl}
        borderColor={accent}
      />
      <p className="mt-2 truncate text-sm font-semibold text-foreground">
        {displayName}
      </p>
      {email ? (
        <p className="truncate text-[11px] text-muted-foreground">{email}</p>
      ) : (
        <p className="truncate text-[11px] text-muted-foreground/70">—</p>
      )}
      <p className="mt-0.5 text-xs font-medium text-sky-300/95">
        {roleLabel}
      </p>
    </div>
  );
});

export const OrgGroupBadge = memo(function OrgGroupBadge(
  props: NodeProps<OrgGroupFlowNode>
) {
  const { data } = props;
  const { label } = data;

  return (
    <div className="relative flex flex-col items-center">
      <Handle
        type="target"
        position={Position.Top}
        className={cn(handleClass, "bg-muted-foreground/40!")}
      />
      <div
        className={cn(
          "rounded-full border-2 border-sky-400/45 bg-linear-to-b from-sky-500/25 to-sky-600/15 px-5 py-1.5 text-sm font-semibold tracking-tight text-sky-50",
          "shadow-md shadow-sky-950/40 ring-2 ring-sky-400/25 ring-offset-2 ring-offset-background/80"
        )}
        style={{ minWidth: LC.hubMinWidth }}
      >
        {label}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(handleClass, "bg-muted-foreground/50!")}
      />
    </div>
  );
});
