"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CreateOrgProjectRequest } from "@/lib/api/services/fetchProject";
import { cn } from "@/lib/utils";

import { ProjectFormDashboardPreview } from "../../components/projectFormDashboardPreview";

const PREVIEW_DIALOG_CLASS = cn(
  "top-3 left-1/2 flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] -translate-x-1/2 -translate-y-0 flex-col overflow-hidden rounded-2xl border-border/80 p-0 shadow-2xl",
  "sm:top-4 sm:h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-1.5rem)] sm:w-[calc(100vw-1.5rem)] sm:max-w-[calc(100vw-1.5rem)]",
  "lg:w-[calc(100vw-2rem)] lg:max-w-[calc(100vw-2rem)]"
);

export function ProjectNewPreviewDialog({
  open,
  onOpenChange,
  form,
  description = "A summary of the information you've entered — laid out like the project dashboard.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateOrgProjectRequest;
  description?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={PREVIEW_DIALOG_CLASS}
        contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-5 py-4 pr-14 text-left sm:px-8 sm:py-5">
          <DialogTitle className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
            Preview
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 xl:px-16">
            <ProjectFormDashboardPreview form={form} />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
