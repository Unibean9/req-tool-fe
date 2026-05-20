import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ProjectDashboardProse({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed whitespace-pre-wrap text-foreground/90",
        className
      )}
    >
      {children}
    </p>
  );
}
