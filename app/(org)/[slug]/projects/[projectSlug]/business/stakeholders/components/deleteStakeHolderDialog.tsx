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

export type DeleteStakeHolderDialogTarget = {
  stakeholderId: string;
  name: string;
};

type DeleteStakeHolderDialogProps = {
  open: boolean;
  target: DeleteStakeHolderDialogTarget | null;
  deletePending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void | Promise<void>;
};

export function DeleteStakeHolderDialog({
  open,
  target,
  deletePending,
  onOpenChange,
  onConfirmDelete,
}: DeleteStakeHolderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete stakeholder?</AlertDialogTitle>
          <AlertDialogDescription>
            {target ? (
              <>
                Stakeholder{" "}
                <span className="font-medium text-foreground">
                  «{target.name}»
                </span>{" "}
                will be deleted from the project. This action cannot be undone.
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
