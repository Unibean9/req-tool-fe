"use client";

import { useState } from "react";
import {
  AlertCircle,
  Download,
  FileDown,
  FileText,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { MarkdownContent } from "@/components/shared/markdownContent";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useProjectBrdExport } from "@/hooks/useProjectExport";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { cn } from "@/lib/utils";

function BrdExportLoading() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-5 py-8 sm:px-8 lg:px-10">
      <Skeleton className="h-8 w-2/3 max-w-md motion-reduce:animate-none" />
      <Skeleton className="h-4 w-1/3 max-w-52 motion-reduce:animate-none" />
      <div className="mt-3 flex flex-col gap-2.5">
        <Skeleton className="h-4 w-full motion-reduce:animate-none" />
        <Skeleton className="h-4 w-[94%] motion-reduce:animate-none" />
        <Skeleton className="h-4 w-[88%] motion-reduce:animate-none" />
      </div>
      <Skeleton className="mt-4 h-6 w-1/2 max-w-72 motion-reduce:animate-none" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-4 w-full motion-reduce:animate-none" />
        <Skeleton className="h-4 w-[91%] motion-reduce:animate-none" />
        <Skeleton className="h-4 w-[72%] motion-reduce:animate-none" />
      </div>
    </div>
  );
}

function markdownFileName(projectSlug: string, includeWont: boolean): string {
  const safeSlug =
    projectSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project";
  return `${safeSlug}-brd${includeWont ? "-with-wont" : ""}.md`;
}

function downloadMarkdown(
  markdown: string,
  projectSlug: string,
  includeWont: boolean
) {
  const blob = new Blob([markdown], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = markdownFileName(projectSlug, includeWont);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  toast.success("BRD Markdown downloaded");
}

export function BrdExportDialog({
  projectId,
  projectSlug,
}: {
  projectId: string | null;
  projectSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [includeWont, setIncludeWont] = useState(false);
  const {
    data: markdown,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useProjectBrdExport(projectId, includeWont, { enabled: open });

  const hasMarkdown = Boolean(markdown?.trim());

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="group/export size-7 text-muted-foreground hover:bg-primary/10 hover:text-brand-mint"
              aria-label="Export BRD"
              disabled={!projectId}
              onClick={() => setOpen(true)}
            >
              <FileDown
                className="transition-transform duration-150 ease-out group-hover/export:translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover/export:translate-y-0"
                aria-hidden
              />
            </Button>
          }
        />
        <TooltipContent side="right">
          {projectId ? "Preview and export BRD" : "Project is loading"}
        </TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="top-2 h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none -translate-y-0 overflow-hidden rounded-xl sm:top-4 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-none"
          contentClassName="relative flex h-full min-h-0 flex-col overflow-hidden"
        >
          <DialogHeader className="shrink-0 gap-4 border-b border-border/70 px-5 py-4 pr-14 sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-brand-mint"
                aria-hidden
              >
                <FileText className="size-[1.125rem]" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-balance text-lg font-semibold">
                  BRD export preview
                </DialogTitle>
                <DialogDescription className="mt-1 text-pretty">
                  Review the generated Markdown before downloading it.
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label
                htmlFor="include-wont-artifacts"
                className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground"
              >
                <Switch
                  id="include-wont-artifacts"
                  checked={includeWont}
                  onCheckedChange={setIncludeWont}
                  aria-label="Include Won't-priority artifacts"
                />
                <span>Include Won&apos;t-priority artifacts</span>
              </label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refetch()}
                  disabled={!projectId || isFetching}
                >
                  <RefreshCw
                    data-icon="inline-start"
                    className={cn(
                      isFetching && "animate-spin motion-reduce:animate-none"
                    )}
                    aria-hidden
                  />
                  Refresh
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!hasMarkdown || isFetching}
                  onClick={() => {
                    if (!markdown) return;
                    downloadMarkdown(markdown, projectSlug, includeWont);
                  }}
                >
                  <Download data-icon="inline-start" aria-hidden />
                  Download .md
                </Button>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="min-h-0 flex-1 bg-background/45">
            {isPending ? <BrdExportLoading /> : null}

            {isError ? (
              <div className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
                <Alert variant="destructive">
                  <AlertCircle aria-hidden />
                  <AlertTitle>Could not generate the BRD preview</AlertTitle>
                  <AlertDescription>
                    {getApiErrorMessage(
                      error,
                      "The BRD Markdown export could not be loaded."
                    )}
                  </AlertDescription>
                </Alert>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => void refetch()}
                >
                  <RefreshCw data-icon="inline-start" aria-hidden />
                  Try again
                </Button>
              </div>
            ) : null}

            {!isPending && !isError && !hasMarkdown ? (
              <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <FileText className="size-5" aria-hidden />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  No BRD content yet
                </p>
                <p className="mt-1 max-w-sm text-pretty text-sm text-muted-foreground">
                  Create or approve artifacts, then refresh this preview.
                </p>
              </div>
            ) : null}

            {!isPending && !isError && hasMarkdown && markdown ? (
              <article className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
                <MarkdownContent content={markdown} variant="document" />
              </article>
            ) : null}
          </ScrollArea>

          <footer className="flex shrink-0 items-center gap-2 border-t border-border/70 bg-muted/20 px-5 py-3 text-xs text-muted-foreground sm:px-6">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                isFetching
                  ? "animate-pulse bg-amber-400 motion-reduce:animate-none"
                  : "bg-primary"
              )}
              aria-hidden
            />
            <span aria-live="polite">
              {isFetching
                ? "Refreshing the current BRD…"
                : includeWont
                  ? "Preview includes Won't-priority artifacts."
                  : "Won't-priority artifacts are excluded."}
            </span>
          </footer>
        </DialogContent>
      </Dialog>
    </>
  );
}
