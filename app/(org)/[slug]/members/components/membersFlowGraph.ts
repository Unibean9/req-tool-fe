"use client";

import {
  orgChartBezierEdgeStyle,
  orgChartLayout,
  type Edge,
  type Node,
} from "@/components/ui/react-flow";

import type { OrgMember } from "@/lib/api/services/fetchUser";

const L = orgChartLayout;

const LEADER_ROLES = new Set(["owner", "leader"]);

export function isLeaderRole(role: string): boolean {
  return LEADER_ROLES.has(role.trim().toLowerCase());
}

export function membershipRoleSubtitle(
  role: string,
  options: {
    syntheticLeader?: boolean;
    orgHasNoOwner?: boolean;
  } = {}
): string {
  if (options.syntheticLeader) return "Team Lead";
  if (options.orgHasNoOwner) return "Member";
  const r = role.trim().toLowerCase();
  if (LEADER_ROLES.has(r)) return "Team Lead";
  if (r === "member") return "Member";
  if (!r) return "Member";
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
}

export function shortMemberUserId(userId: string): string {
  if (userId.length <= 12) return userId;
  return `${userId.slice(0, 8)}…${userId.slice(-4)}`;
}

export function orgMemberRowLabels(
  member: OrgMember | null,
  options: {
    fallbackUserId?: string;
    syntheticLeader?: boolean;
    orgHasNoOwner?: boolean;
  } = {}
): {
  userId: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  roleLabel: string;
} {
  if (options.syntheticLeader && options.fallbackUserId) {
    const id = options.fallbackUserId;
    return {
      userId: id,
      displayName: shortMemberUserId(id),
      email: null,
      avatarUrl: null,
      roleLabel: membershipRoleSubtitle("", { syntheticLeader: true }),
    };
  }

  if (!member) {
    const id = options.fallbackUserId ?? "";
    return {
      userId: id,
      displayName: shortMemberUserId(id),
      email: null,
      avatarUrl: null,
      roleLabel: membershipRoleSubtitle("", {
        orgHasNoOwner: options.orgHasNoOwner ?? false,
      }),
    };
  }

  const u = member.user;
  const sid = shortMemberUserId(member.userId);
  const displayName =
    u?.fullName?.trim() ||
    (u?.githubLogin ? `@${u.githubLogin}` : sid);

  return {
    userId: member.userId,
    displayName,
    email: u?.email?.trim() ?? null,
    avatarUrl: u?.githubAvatarUrl?.trim() || null,
    roleLabel: membershipRoleSubtitle(member.role, {
      orgHasNoOwner: options.orgHasNoOwner ?? false,
    }),
  };
}

export type OrgOwnerFlowData = {
  userId: string;
  role: string;
  synthetic?: boolean;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  roleLabel: string;
};

export type OrgMemberFlowData = {
  userId: string;
  role: string;
  orgHasNoOwner: boolean;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  roleLabel: string;
};

export type OrgGroupFlowData = {
  label: string;
};

/**
 * Builds nodes/edges for the org chart:
 * - with `ownerId`: Leader → "Members" hub → individual members;
 * - without owner: a single row of members.
 */
export function buildOrgMembersFlowGraph(
  ownerId: string | null,
  members: OrgMember[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const orgHasOwner = ownerId != null && ownerId.length > 0;

  if (!orgHasOwner) {
    const rowY = 72;
    const n = members.length;
    const totalW = n * L.cardWidth + Math.max(0, n - 1) * L.hGap;
    const cxRow = Math.max(L.centerX, totalW / 2 + L.cardWidth);
    const startX = cxRow - totalW / 2;

    members.forEach((m, i) => {
      const id = `member-${m.userId}`;
      const labels = orgMemberRowLabels(m, { orgHasNoOwner: true });
      nodes.push({
        id,
        type: "orgMember",
        position: {
          x:
            n === 1
              ? cxRow - L.cardWidth / 2
              : startX + i * (L.cardWidth + L.hGap),
          y: rowY,
        },
        data: {
          userId: m.userId,
          role: m.role,
          orgHasNoOwner: true,
          displayName: labels.displayName,
          email: labels.email,
          avatarUrl: labels.avatarUrl,
          roleLabel: labels.roleLabel,
        } satisfies OrgMemberFlowData,
      });
    });

    return { nodes, edges };
  }

  const ownerMember = members.find((m) => m.userId === ownerId);
  const others = members.filter((m) => m.userId !== ownerId);

  const k = others.length;
  const memberRowW = k * L.cardWidth + Math.max(0, k - 1) * L.hGap;
  const cx = Math.max(L.centerX, memberRowW / 2 + L.cardWidth + 40);

  const ownerY = 44;
  const ownerLabels = ownerMember
    ? orgMemberRowLabels(ownerMember, {})
    : orgMemberRowLabels(null, {
        syntheticLeader: true,
        fallbackUserId: ownerId,
      });

  nodes.push({
    id: "owner",
    type: "orgOwner",
    position: { x: cx - L.cardWidth / 2, y: ownerY },
    data: {
      userId: ownerId,
      role: ownerMember?.role ?? "owner",
      synthetic: !ownerMember,
      displayName: ownerLabels.displayName,
      email: ownerLabels.email,
      avatarUrl: ownerLabels.avatarUrl,
      roleLabel: ownerLabels.roleLabel,
    } satisfies OrgOwnerFlowData,
  });

  if (others.length === 0) {
    return { nodes, edges };
  }

  const groupY = ownerY + L.cardHeight + L.vGap - 8;
  nodes.push({
    id: "group-members",
    type: "orgGroup",
    position: { x: cx - L.groupWidth / 2, y: groupY },
    data: { label: "Members" } satisfies OrgGroupFlowData,
  });

  edges.push({
    id: "e-owner-group",
    source: "owner",
    target: "group-members",
    type: "default",
    style: orgChartBezierEdgeStyle,
  });

  const rowY = groupY + 52;
  const startX = cx - memberRowW / 2;

  others.forEach((m, i) => {
    const id = `member-${m.userId}`;
    const labels = orgMemberRowLabels(m, { orgHasNoOwner: false });
    nodes.push({
      id,
      type: "orgMember",
      position: {
        x: startX + i * (L.cardWidth + L.hGap),
        y: rowY,
      },
      data: {
        userId: m.userId,
        role: m.role,
        orgHasNoOwner: false,
        displayName: labels.displayName,
        email: labels.email,
        avatarUrl: labels.avatarUrl,
        roleLabel: labels.roleLabel,
      } satisfies OrgMemberFlowData,
    });
    edges.push({
      id: `e-group-${id}`,
      source: "group-members",
      target: id,
      type: "default",
      style: orgChartBezierEdgeStyle,
    });
  });

  return { nodes, edges };
}
