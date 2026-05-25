"use client";

import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { EpicDetailForm } from "../epic/epicDetailForm";
import { FeatureDetailForm } from "../features/featureDetailForm";
import { UserStoryDetailForm } from "../userStory/userStoryDetailForm";
import { REQUIREMENT_KIND_LABELS } from "./requirementsModelConstants";
import { useRequirementsModel } from "./requirementsModelContext";
import type { RequirementNodeData } from "./requirementsModelTypes";
import {
  isEpicNodeData,
  isFeatureNodeData,
  isUserStoryNodeData,
} from "./requirementsModelTypes";

function panelTitle(data: RequirementNodeData): string {
  if (
    isEpicNodeData(data) ||
    isFeatureNodeData(data) ||
    isUserStoryNodeData(data)
  ) {
    return data.title || REQUIREMENT_KIND_LABELS[data.kind];
  }
  return "—";
}

export function RequirementsDetailPanel() {
  const {
    nodes,
    selectedNodeId,
    panelOpen,
    closePanel,
    updateNodeData,
    deleteNode,
    isUpdatingEpic,
    isDeletingEpic,
    isUpdatingFeature,
    isDeletingFeature,
    isUpdatingUserStory,
    isDeletingUserStory,
  } = useRequirementsModel();

  const node = nodes.find((n) => n.id === selectedNodeId);
  const kind = node?.data.kind;
  const canDeleteEpic = node && isEpicNodeData(node.data);
  const canDeleteFeature = node && isFeatureNodeData(node.data);
  const canDeleteUserStory = node && isUserStoryNodeData(node.data);
  const formId = node ? `requirement-detail-form-${node.id}` : undefined;
  const isSaving =
    (canDeleteEpic && isUpdatingEpic) ||
    (canDeleteFeature && isUpdatingFeature) ||
    (canDeleteUserStory && isUpdatingUserStory);
  const isDeleting =
    (canDeleteEpic && isDeletingEpic) ||
    (canDeleteFeature && isDeletingFeature) ||
    (canDeleteUserStory && isDeletingUserStory);
  const deleteLabel = canDeleteEpic
    ? "Delete Epic"
    : canDeleteFeature
      ? "Delete Feature"
      : canDeleteUserStory
        ? "Delete User Story"
        : "Xóa";

  return (
    <Dialog
      open={panelOpen && Boolean(node)}
      onOpenChange={(open) => {
        if (!open) closePanel();
      }}
    >
      <DialogContent
        className={canDeleteUserStory ? "sm:max-w-4xl" : "sm:max-w-2xl"}
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-border/60 pb-3">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            {kind ? REQUIREMENT_KIND_LABELS[kind] : "Details"}
          </p>
          <DialogTitle className="truncate text-xl">
            {node ? panelTitle(node.data) : "Select a card on the diagram"}
          </DialogTitle>
          <DialogDescription>
            Edit the information in this dialog, then click Update to save.
          </DialogDescription>
        </DialogHeader>

        {node && formId ? (
          <div className="max-h-[min(68vh,42rem)] overflow-y-auto pr-1">
            {isEpicNodeData(node.data) ? (
              <EpicDetailForm
                key={node.id}
                formId={formId}
                data={node.data}
                onChange={(patch) => updateNodeData(node.id, patch)}
                isSaving={isUpdatingEpic}
              />
            ) : null}
            {isFeatureNodeData(node.data) ? (
              <FeatureDetailForm
                key={node.id}
                formId={formId}
                data={node.data}
                onChange={(patch) => updateNodeData(node.id, patch)}
                isSaving={isUpdatingFeature}
              />
            ) : null}
            {isUserStoryNodeData(node.data) ? (
              <UserStoryDetailForm
                key={node.id}
                formId={formId}
                data={node.data}
                onChange={(patch) => updateNodeData(node.id, patch)}
                isSaving={isUpdatingUserStory}
              />
            ) : null}
          </div>
        ) : null}

        <DialogFooter className="flex-row justify-end gap-3 sm:justify-end">
          {node ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="min-w-0"
              disabled={isDeleting || isSaving}
              onClick={() => deleteNode(node.id)}
            >
              <Trash2 className="size-3.5" aria-hidden />
              {deleteLabel}
            </Button>
          ) : null}
          <Button
            type="submit"
            form={formId}
            size="sm"
            className="min-w-0"
            disabled={!formId || isSaving || isDeleting}
          >
            <Save className="size-3.5" aria-hidden />
            {isSaving ? "Saving…" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
