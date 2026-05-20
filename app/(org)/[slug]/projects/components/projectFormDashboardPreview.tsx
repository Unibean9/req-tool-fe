"use client";

import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";
import { cn } from "@/lib/utils";

import { PROJECT_BUSINESS_VALUE_LABEL } from "../project-new/components/projectFormLimits";
import { ProjectDashboardIndexedList } from "../[projectSlug]/dashboard/components/projectDashboardIndexedList";
import { ProjectDashboardMeta } from "../[projectSlug]/dashboard/components/projectDashboardMeta";
import { ProjectDashboardProse } from "../[projectSlug]/dashboard/components/projectDashboardProse";
import { ProjectDashboardSection } from "../[projectSlug]/dashboard/components/projectDashboardSection";

const DASHBOARD_PAIR_ROW_CLASS =
  "grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-x-12 xl:gap-x-16";

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
  const executiveSummary = (form.executiveSummary ?? "").trim();
  const description = (form.description ?? "").trim();
  const context = (form.context ?? "").trim();
  const roiNotes = (form.roiNotes ?? "").trim();
  const problems = form.problems ?? [];
  const proposedSolutions = form.proposedSolutions ?? [];
  const budgetWire =
    form.budget != null && Number.isFinite(form.budget)
      ? String(form.budget)
      : null;

  return (
    <div className={cn("flex flex-col gap-8 pb-2", className)}>
      <header className="space-y-4 border-b border-border/50 pb-6">
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {name || "—"}
          </h1>
          {executiveSummary ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {executiveSummary}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Chưa có mô tả ngắn.
            </p>
          )}
        </div>

        <ProjectDashboardMeta
          startDate={form.startDate ?? ""}
          endDate={form.endDate ?? ""}
          budget={budgetWire}
        />
      </header>

      <div className={DASHBOARD_PAIR_ROW_CLASS}>
        <ProjectDashboardSection title="Mô tả" accent="violet">
          {description ? (
            <ProjectDashboardProse>{description}</ProjectDashboardProse>
          ) : (
            <EmptyHint>Chưa có mô tả chi tiết.</EmptyHint>
          )}
        </ProjectDashboardSection>

        <ProjectDashboardSection title="Ngữ cảnh" accent="sky">
          {context ? (
            <ProjectDashboardProse>{context}</ProjectDashboardProse>
          ) : (
            <EmptyHint>Chưa có ngữ cảnh.</EmptyHint>
          )}
        </ProjectDashboardSection>
      </div>

      <div className={DASHBOARD_PAIR_ROW_CLASS}>
        <ProjectDashboardSection title="Vấn đề" accent="orange">
          <ProjectDashboardIndexedList
            items={problems}
            emptyLabel="Chưa có vấn đề nào."
          />
        </ProjectDashboardSection>

        <ProjectDashboardSection title="Giải pháp đề xuất" accent="fuchsia">
          <ProjectDashboardIndexedList
            items={proposedSolutions}
            emptyLabel="Chưa có đề xuất giải pháp."
          />
        </ProjectDashboardSection>
      </div>

      <ProjectDashboardSection
        title={PROJECT_BUSINESS_VALUE_LABEL}
        accent="teal"
      >
        {roiNotes ? (
          <ProjectDashboardProse>{roiNotes}</ProjectDashboardProse>
        ) : (
          <EmptyHint>Chưa có mục đích kinh doanh.</EmptyHint>
        )}
      </ProjectDashboardSection>
    </div>
  );
}
