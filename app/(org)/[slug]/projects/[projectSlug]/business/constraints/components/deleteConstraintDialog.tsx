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

export type DeleteConstraintDialogTarget = {
  constraintId: string;
  preview: string;
};

type DeleteConstraintDialogProps = {
  open: boolean;
  target: DeleteConstraintDialogTarget | null;
  deletePending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void | Promise<void>;
};

export function DeleteConstraintDialog({
  open,
  target,
  deletePending,
  onOpenChange,
  onConfirmDelete,
}: DeleteConstraintDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete constraint?</AlertDialogTitle>
          <AlertDialogDescription>
            {target ? (
              <>
                Constraint{" "}
                <span className="font-medium text-foreground">
                  «{target.preview}»
                </span>{" "}
                will be permanently removed from the project. This action cannot be undone.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deletePending || !target}
            onClick={() => void onConfirmDelete()}
          >
            {deletePending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
