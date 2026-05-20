"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { OrgAppHeader } from "./orgAppHeader";
import {
  isOrgProjectSlugWorkspacePath,
  isOrgProjectWizardPath,
} from "./orgWorkspacePaths";

export {
  isOrgProjectNewWizardPath,
  isOrgProjectSlugWorkspacePath,
  isOrgProjectWizardPath,
} from "./orgWorkspacePaths";

export function OrgLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const hideOrgChrome =
    isOrgProjectWizardPath(pathname) || isOrgProjectSlugWorkspacePath(pathname);

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
      {!hideOrgChrome ? <OrgAppHeader /> : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden",
          !hideOrgChrome &&
            "max-md:pb-[calc(4.25rem+env(safe-area-inset-bottom))]"
        )}
      >
        {children}
      </div>
    </div>
  );
}
