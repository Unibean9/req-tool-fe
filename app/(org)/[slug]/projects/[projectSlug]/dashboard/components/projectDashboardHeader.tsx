"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, Download, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { buildProjectEditPath } from "@/app/(org)/components/orgWorkspacePaths";
import { Button, buttonVariants } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import type { OrgProject } from "@/lib/api/services/fetchProject";
import { useDeleteOrgProject, useProjectBrdExport } from "@/hooks/useProject";
import { cn } from "@/lib/utils";

import { useOrgWorkspace } from "../../../../orgWorkspaceContext";
import { useProjectWorkspaceNav } from "../../components/projectWorkspaceNavContext";
import { DeleteOrgProjectDialog } from "./deleteOrgProjectDialog";
import { ProjectDashboardMeta } from "./projectDashboardMeta";

export type ProjectDashboardHeaderProps = {
  project: OrgProject;
  orgId: string;
};

function sanitizeMarkdownFileName(value: string): string {
  const safe = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || "project-brd";
}

function downloadMarkdownFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ProjectDashboardHeader({
  project,
  orgId,
}: ProjectDashboardHeaderProps) {
  const { slug } = useOrgWorkspace();
  const pathname = usePathname() ?? "";
  const { navigateAfterProjectDelete } = useProjectWorkspaceNav();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "success">(
    "idle"
  );
  const downloadResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const brdExportQuery = useProjectBrdExport(project.id, { enabled: false });
  const downloadPending = brdExportQuery.isFetching;
  const downloadSuccessful = downloadStatus === "success";

  const deleteMutation = useDeleteOrgProject({
    onSuccess: (_data, variables, context) => {
      setDeleteOpen(false);
      navigateAfterProjectDelete(variables.projectId, context?.nextSlug);
    },
  });

  const executiveSummary = project.executiveSummary.trim();
  const editHref = buildProjectEditPath(slug, project.slug, {
    returnTo: pathname,
  });
  const brdFileName = `${sanitizeMarkdownFileName(project.slug || project.name)}-brd.md`;

  useEffect(() => {
    return () => {
      if (downloadResetTimeoutRef.current) {
        clearTimeout(downloadResetTimeoutRef.current);
      }
    };
  }, []);

  async function handleDownloadBrd() {
    if (downloadPending) return;
    setDownloadStatus("idle");
    if (downloadResetTimeoutRef.current) {
      clearTimeout(downloadResetTimeoutRef.current);
    }

    const result = await brdExportQuery.refetch();
    if (result.isError) {
      toast.error(getApiErrorMessage(result.error, "Không tải được file BRD"));
      return;
    }
    if (typeof result.data === "string") {
      downloadMarkdownFile(result.data, brdFileName);
      setDownloadStatus("success");
      downloadResetTimeoutRef.current = setTimeout(() => {
        setDownloadStatus("idle");
      }, 1400);
    }
  }

  return (
    <>
      <header className="space-y-4 border-b border-border/50 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {project.name}
            </h1>
            {executiveSummary ? (
              <p
                className={cn(
                  "max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base"
                )}
              >
                {executiveSummary}
              </p>
            ) : (
              <p className="text-sm italic text-muted-foreground">
                Chưa có mô tả ngắn.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "gap-1.5 border-border/80 transition-[color,background-color,border-color,box-shadow] duration-200 ease-out",
                downloadSuccessful &&
                  "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 shadow-sm shadow-emerald-500/10 hover:bg-emerald-500/10 dark:text-emerald-300"
              )}
              onClick={() => void handleDownloadBrd()}
              disabled={downloadPending}
              aria-live="polite"
            >
              <span className="relative size-3.5 shrink-0" aria-hidden>
                <Download
                  className={cn(
                    "absolute inset-0 size-3.5 transition-[opacity,transform,filter] duration-200 ease-out motion-reduce:transition-none",
                    downloadSuccessful
                      ? "scale-75 translate-y-1 opacity-0 blur-[1px]"
                      : downloadPending
                        ? "animate-pulse opacity-80"
                        : "scale-100 translate-y-0 opacity-100"
                  )}
                />
                <Check
                  className={cn(
                    "absolute inset-0 size-3.5 transition-[opacity,transform,filter] duration-200 ease-out motion-reduce:transition-none",
                    downloadSuccessful
                      ? "scale-100 rotate-0 opacity-100 blur-0"
                      : "scale-50 rotate-[-20deg] opacity-0 blur-[1px]"
                  )}
                  strokeWidth={2.5}
                />
              </span>
              <span className="min-w-14 text-left transition-opacity duration-200 motion-reduce:transition-none">
                {downloadPending
                  ? "Đang tải..."
                  : downloadSuccessful
                    ? "Đã tải"
                    : "Tải MD"}
              </span>
            </Button>
            <Link
              href={editHref}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "gap-1.5 border-border/80",
              })}
            >
              <Pencil className="size-3.5" aria-hidden />
              Chỉnh sửa
            </Link>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Xóa dự án
            </Button>
          </div>
        </div>

        <ProjectDashboardMeta
          startDate={project.startDate}
          endDate={project.endDate}
          budget={project.budget}
        />
      </header>

      <DeleteOrgProjectDialog
        open={deleteOpen}
        projectName={project.name}
        deletePending={deleteMutation.isPending}
        onOpenChange={setDeleteOpen}
        onConfirmDelete={() =>
          deleteMutation.mutate({ orgId, projectId: project.id })
        }
      />
    </>
  );
}
