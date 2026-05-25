"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteOrgProjectDialogProps = {
  open: boolean;
  projectName: string;
  deletePending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void | Promise<void>;
};

export function DeleteOrgProjectDialog({
  open,
  projectName,
  deletePending,
  onOpenChange,
  onConfirmDelete,
}: DeleteOrgProjectDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete project?</AlertDialogTitle>
          <AlertDialogDescription>
            The project{" "}
            <span className="font-medium text-foreground">«{projectName}»</span>{" "}
            and all related data will be permanently deleted. This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deletePending}
            onClick={() => void onConfirmDelete()}
          >
            {deletePending ? "Deleting…" : "Delete Project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
