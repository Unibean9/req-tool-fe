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

export type DeleteRuleDialogTarget = {
  ruleId: string;
  preview: string;
};

type DeleteRuleDialogProps = {
  open: boolean;
  target: DeleteRuleDialogTarget | null;
  deletePending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDelete: () => void | Promise<void>;
};

export function DeleteRuleDialog({
  open,
  target,
  deletePending,
  onOpenChange,
  onConfirmDelete,
}: DeleteRuleDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete rule?</AlertDialogTitle>
          <AlertDialogDescription>
            {target ? (
              <>
                <span className="font-medium text-foreground">
                  «{target.preview}»
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
