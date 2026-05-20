"use client";

import { useState } from "react";

import {
  DetailFieldRow,
  DetailLabelTagsField,
  DetailPrioritySelect,
  DetailStatusSelect,
  DetailTextAreaField,
  DetailTextField,
} from "../model/requirementDetailPanelUi";
import {
  REQ_DESCRIPTION_MAX_CHARS,
  REQ_TITLE_MAX_CHARS,
} from "../model/requirementDetailFormLimits";
import {
  PANEL_EDITABLE_STATUSES,
  type PanelEditableStatus,
} from "../model/requirementWorkItemLabels";
import type { EpicNodeData, EpicStatus } from "./epicTypes";
import { EPIC_PRIORITIES, type EpicPriority } from "./epicTypes";

type EpicDraft = {
  title: string;
  description: string;
  status: PanelEditableStatus | EpicStatus;
  priority: EpicPriority;
  labels: string;
};

function panelStatusToEpic(status: PanelEditableStatus | EpicStatus): EpicStatus {
  if (status === "in_progress") return "active";
  return status;
}

function epicStatusToPanel(status: EpicStatus): PanelEditableStatus | EpicStatus {
  if (status === "active") return "in_progress";
  return status;
}

function draftFromEpic(data: EpicNodeData): EpicDraft {
  return {
    title: data.title,
    description: data.description,
    status: epicStatusToPanel(data.status),
    priority: data.priority,
    labels: data.labels,
  };
}

function sameEpicDraft(a: EpicDraft, b: EpicDraft): boolean {
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.status === b.status &&
    a.priority === b.priority &&
    a.labels === b.labels
  );
}

/** Chỉ các field trong PATCH `/epics/{id}`: title, description, status, priority, labels. */
export function EpicDetailForm({
  data,
  onChange,
  isSaving,
  formId,
}: {
  data: EpicNodeData;
  onChange: (patch: Partial<EpicNodeData>) => void;
  isSaving?: boolean;
  formId: string;
}) {
  const [baseDraft, setBaseDraft] = useState<EpicDraft>(() =>
    draftFromEpic(data)
  );
  const [draft, setDraft] = useState<EpicDraft>(() => draftFromEpic(data));
  const dirty = !sameEpicDraft(draft, baseDraft);

  function updateDraft(patch: Partial<EpicDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty || isSaving) return;
    onChange({
      title: draft.title,
      description: draft.description,
      status: panelStatusToEpic(draft.status),
      priority: draft.priority,
      labels: draft.labels,
    });
    setBaseDraft(draft);
  }

  return (
    <form id={formId} className="space-y-6" onSubmit={submit}>
        <DetailTextField
          id="epic-title"
          label="Tiêu đề"
          value={draft.title}
          onChange={(title) => updateDraft({ title })}
          maxLength={REQ_TITLE_MAX_CHARS}
          placeholder="VD: Quản lý lịch làm việc theo ca"
        />
        <DetailTextAreaField
          id="epic-desc"
          label="Mô tả"
          value={draft.description}
          onChange={(description) => updateDraft({ description })}
          maxLength={REQ_DESCRIPTION_MAX_CHARS}
          rows={4}
          placeholder="Mục tiêu nghiệp vụ, phạm vi và giá trị của epic…"
        />
        <DetailFieldRow>
          <DetailStatusSelect<PanelEditableStatus | EpicStatus>
            id="epic-status"
            label="Trạng thái"
            value={draft.status}
            options={PANEL_EDITABLE_STATUSES}
            onChange={(status) => updateDraft({ status })}
            colored
          />
          <DetailPrioritySelect
            id="epic-priority"
            label="Độ ưu tiên"
            value={draft.priority}
            options={EPIC_PRIORITIES}
            onChange={(priority) => updateDraft({ priority })}
            colored
          />
        </DetailFieldRow>
        <DetailLabelTagsField
          id="epic-labels"
          label="Label"
          value={draft.labels}
          onChange={(labels) => updateDraft({ labels })}
        />
    </form>
  );
}
