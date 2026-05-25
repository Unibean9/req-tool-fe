"use client";

import { createContext, useContext } from "react";

import type { Org } from "@/lib/api/services/fetchOrg";

export type OrgWorkspaceContextValue = {
  slug: string;
  orgId: string;
  orgFromList: Org;
  orgs: Org[];
  canManageOrgMembers: boolean;
  selfUserId: string;
};

export const OrgWorkspaceContext =
  createContext<OrgWorkspaceContextValue | null>(null);

export function useOrgWorkspace(): OrgWorkspaceContextValue {
  const ctx = useContext(OrgWorkspaceContext);
  if (!ctx) {
    throw new Error("useOrgWorkspace must be used within OrgSlugLayout.");
  }
  return ctx;
}
