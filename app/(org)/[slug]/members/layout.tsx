import type { ReactNode } from "react";

/** Locks height using flex — no page scroll; scroll only within the panel/diagram if needed. */
export default function OrgMembersLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {children}
    </div>
  );
}
