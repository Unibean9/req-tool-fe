"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProjectActor } from "@/hooks/useActor";
import type { ProjectActor } from "@/lib/api/services/fetchActor";

import {
  ACTOR_NAME_MAX_CHARS,
  ACTOR_ROLE_DESCRIPTION_MAX_CHARS,
} from "./actorFormLimits";

type EditProjectActorDialogProps = {
  projectId: string | null;
  actor: ProjectActor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Khóa nút sửa/xóa trên list khi đang PATCH actor */
  onRowInteractBusy?: (busy: boolean) => void;
};

type EditProjectActorDialogFormProps = {
  projectId: string;
  actor: ProjectActor;
  onOpenChange: (open: boolean) => void;
  onRowInteractBusy?: (busy: boolean) => void;
};

function EditProjectActorDialogForm({
  projectId,
  actor,
  onOpenChange,
  onRowInteractBusy,
}: EditProjectActorDialogFormProps) {
  const [editName, setEditName] = useState(
    () => actor.name.slice(0, ACTOR_NAME_MAX_CHARS)
  );
  const [editRoleDescription, setEditRoleDescription] = useState(
    () => actor.roleDescription.slice(0, ACTOR_ROLE_DESCRIPTION_MAX_CHARS)
  );

  const updateActorMutation = useUpdateProjectActor({
    onMutate: () => onRowInteractBusy?.(true),
    onSettled: () => onRowInteractBusy?.(false),
    onSuccess: () => onOpenChange(false),
  });

  const editNameTrimmed = editName.trim();
  const editRoleTrimmed = editRoleDescription.trim();
  const updatePending = updateActorMutation.isPending;

  const canSubmitEdit =
    editNameTrimmed.length > 0 &&
    editRoleTrimmed.length > 0 &&
    !updatePending;

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmitEdit) return;
    await updateActorMutation.mutateAsync({
      projectId,
      actorId: actor.id,
      body: {
        name: editNameTrimmed.slice(0, ACTOR_NAME_MAX_CHARS),
        roleDescription: editRoleTrimmed.slice(
          0,
          ACTOR_ROLE_DESCRIPTION_MAX_CHARS
        ),
      },
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg">Edit actor</DialogTitle>
        <DialogDescription>
          Update the name and role description (same character limits as when creating).
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => void handleEditSubmit(e)}>
        <div className="grid gap-3 px-1 py-2">
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label
                htmlFor="sidebar-edit-actor-name"
                className="text-sm font-semibold"
              >
                Name
              </Label>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {editName.length}/{ACTOR_NAME_MAX_CHARS}
              </span>
            </div>
            <Input
              id="sidebar-edit-actor-name"
              autoComplete="off"
              maxLength={ACTOR_NAME_MAX_CHARS}
              value={editName}
              onChange={(e) =>
                setEditName(e.target.value.slice(0, ACTOR_NAME_MAX_CHARS))
              }
              placeholder="E.g.: Customer"
              disabled={updatePending}
              className="h-10"
            />
          </div>
          <div className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label
                htmlFor="sidebar-edit-actor-role"
                className="text-sm font-semibold"
              >
                Role description
              </Label>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {editRoleDescription.length}/{ACTOR_ROLE_DESCRIPTION_MAX_CHARS}
              </span>
            </div>
            <Textarea
              id="sidebar-edit-actor-role"
              maxLength={ACTOR_ROLE_DESCRIPTION_MAX_CHARS}
              value={editRoleDescription}
              onChange={(e) =>
                setEditRoleDescription(
                  e.target.value.slice(0, ACTOR_ROLE_DESCRIPTION_MAX_CHARS)
                )
              }
              placeholder="E.g.: Confirms requirements from the business team"
              disabled={updatePending}
              rows={3}
              className="min-h-18 resize-none text-sm"
            />
          </div>
        </div>
        <DialogFooter className="mt-2 gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={updatePending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmitEdit}>
            {updatePending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function EditProjectActorDialog({
  projectId,
  actor,
  open,
  onOpenChange,
  onRowInteractBusy,
}: EditProjectActorDialogProps) {
  const canEdit =
    typeof projectId === "string" &&
    projectId.length > 0 &&
    actor != null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        {canEdit ? (
          <EditProjectActorDialogForm
            key={actor.id}
            projectId={projectId}
            actor={actor}
            onOpenChange={onOpenChange}
            onRowInteractBusy={onRowInteractBusy}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
