"use client";

import { useCallback, useState } from "react";

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
import { useCreateProjectActor } from "@/hooks/useActor";

import {
  ACTOR_NAME_MAX_CHARS,
  ACTOR_ROLE_DESCRIPTION_MAX_CHARS,
} from "./actorFormLimits";

type CreateProjectActorDialogProps = {
  projectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled: boolean;
};

export function CreateProjectActorDialog({
  projectId,
  open,
  onOpenChange,
  disabled,
}: CreateProjectActorDialogProps) {
  const [name, setName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");

  const resetForm = useCallback(() => {
    setName("");
    setRoleDescription("");
  }, []);

  const createActorMutation = useCreateProjectActor({
    onSuccess: () => {
      onOpenChange(false);
      resetForm();
    },
  });

  const nameTrimmed = name.trim();
  const roleTrimmed = roleDescription.trim();
  const canSubmit =
    typeof projectId === "string" &&
    projectId.length > 0 &&
    !disabled &&
    nameTrimmed.length > 0 &&
    roleTrimmed.length > 0 &&
    !createActorMutation.isPending;

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectId || !canSubmit) return;
    void createActorMutation.mutateAsync({
      projectId,
      body: {
        name: nameTrimmed.slice(0, ACTOR_NAME_MAX_CHARS),
        roleDescription: roleTrimmed.slice(
          0,
          ACTOR_ROLE_DESCRIPTION_MAX_CHARS
        ),
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg">Add actor</DialogTitle>
            <DialogDescription>
              Name and role description (character limit keeps it compact in the sidebar).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 px-1 py-2">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="sidebar-actor-name"
                  className="text-sm font-semibold"
                >
                  Name
                </Label>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {name.length}/{ACTOR_NAME_MAX_CHARS}
                </span>
              </div>
              <Input
                id="sidebar-actor-name"
                autoComplete="off"
                maxLength={ACTOR_NAME_MAX_CHARS}
                value={name}
                onChange={(e) =>
                  setName(e.target.value.slice(0, ACTOR_NAME_MAX_CHARS))
                }
                placeholder="E.g.: Customer"
                disabled={createActorMutation.isPending}
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="sidebar-actor-role"
                  className="text-sm font-semibold"
                >
                  Role description
                </Label>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {roleDescription.length}/{ACTOR_ROLE_DESCRIPTION_MAX_CHARS}
                </span>
              </div>
              <Textarea
                id="sidebar-actor-role"
                maxLength={ACTOR_ROLE_DESCRIPTION_MAX_CHARS}
                value={roleDescription}
                onChange={(e) =>
                  setRoleDescription(
                    e.target.value.slice(0, ACTOR_ROLE_DESCRIPTION_MAX_CHARS)
                  )
                }
                placeholder="E.g.: Confirms requirements from the business team"
                disabled={createActorMutation.isPending}
                rows={3}
                className="min-h-18 resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter className="mt-2 gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={createActorMutation.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {createActorMutation.isPending ? "Creating…" : "Add actor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
