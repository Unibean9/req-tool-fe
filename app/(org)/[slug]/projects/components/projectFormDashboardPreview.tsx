"use client";

import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";
import { cn } from "@/lib/utils";

import { ProjectDashboardProse } from "../[projectSlug]/(deliverables)/dashboard/components/projectDashboardProse";
import { ProjectDashboardSection } from "../[projectSlug]/(deliverables)/dashboard/components/projectDashboardSection";

function EmptyHint({ children }: { children: string }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground italic">
      {children}
    </p>
  );
}

export type ProjectFormDashboardPreviewProps = {
  form: CreateOrgProjectRequest;
  className?: string;
};

export function ProjectFormDashboardPreview({
  form,
  className,
}: ProjectFormDashboardPreviewProps) {
  const name = (form.name ?? "").trim();
  const description = (form.description ?? "").trim();

  return (
    <div className={cn("flex flex-col gap-8 pb-2", className)}>
      <header className="space-y-2 border-b border-border/50 pb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {name || "—"}
        </h1>
      </header>

      <ProjectDashboardSection title="Description" accent="violet">
        {description ? (
          <ProjectDashboardProse>{description}</ProjectDashboardProse>
        ) : (
          <EmptyHint>No description yet.</EmptyHint>
        )}
      </ProjectDashboardSection>
    </div>
  );
}
