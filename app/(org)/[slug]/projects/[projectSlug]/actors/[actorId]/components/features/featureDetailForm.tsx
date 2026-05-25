"use client";

import { useState } from "react";

import {
  DetailFieldRow,
  DetailLabelTagsField,
  DetailPanelSection,
  DetailPrioritySelect,
  DetailStatusSelect,
  DetailTextAreaField,
  DetailTextField,
} from "../model/requirementDetailPanelUi";
import {
  REQ_DESCRIPTION_MAX_CHARS,
  REQ_TITLE_MAX_CHARS,
} from "../model/requirementDetailFormLimits";
import { PANEL_EDITABLE_STATUSES } from "../model/requirementWorkItemLabels";
import type { PanelEditableStatus } from "../model/requirementWorkItemLabels";
import type {
  FeatureNodeData,
  FeaturePriority,
  FeatureStatus,
} from "./featureTypes";
import { FEATURE_PRIORITIES } from "./featureTypes";

type FeatureDraft = {
  title: string;
  description: string;
  status: PanelEditableStatus | FeatureStatus;
  priority: FeaturePriority;
  labels: string;
};

function draftFromFeature(data: FeatureNodeData): FeatureDraft {
  return {
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    labels: data.labels,
  };
}

function sameFeatureDraft(a: FeatureDraft, b: FeatureDraft): boolean {
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.status === b.status &&
    a.priority === b.priority &&
    a.labels === b.labels
  );
}

/** Chỉ các field trong PATCH `/features/{id}`: title, description, status, priority, labels. */
export function FeatureDetailForm({
  data,
  onChange,
  isSaving,
  formId,
}: {
  data: FeatureNodeData;
  onChange: (patch: Partial<FeatureNodeData>) => void;
  isSaving?: boolean;
  formId: string;
}) {
  const [baseDraft, setBaseDraft] = useState<FeatureDraft>(() =>
    draftFromFeature(data)
  );
  const [draft, setDraft] = useState<FeatureDraft>(() => draftFromFeature(data));
  const dirty = !sameFeatureDraft(draft, baseDraft);

  function updateDraft(patch: Partial<FeatureDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty || isSaving) return;
    onChange({
      title: draft.title,
      description: draft.description,
      status: draft.status,
      priority: draft.priority,
      labels: draft.labels,
    });
    setBaseDraft(draft);
  }

  return (
    <form id={formId} className="space-y-6" onSubmit={submit}>
      <DetailPanelSection
        title="Feature"
        hint="A specific business capability within an epic. Click Update when done editing."
      >
        <DetailTextField
          id="feature-title"
          label="Title"
          value={draft.title}
          onChange={(title) => updateDraft({ title })}
          maxLength={REQ_TITLE_MAX_CHARS}
          placeholder="e.g. View and edit shift schedule"
        />
        <DetailTextAreaField
          id="feature-desc"
          label="Description"
          value={draft.description}
          onChange={(description) => updateDraft({ description })}
          maxLength={REQ_DESCRIPTION_MAX_CHARS}
          rows={4}
          placeholder="The business capability this feature provides…"
        />
        <DetailFieldRow>
          <DetailStatusSelect
            id="feature-status"
            label="Status"
            value={draft.status}
            options={PANEL_EDITABLE_STATUSES}
            onChange={(status) => updateDraft({ status })}
            colored
          />
          <DetailPrioritySelect
            id="feature-priority"
            label="Priority"
            value={draft.priority}
            options={FEATURE_PRIORITIES}
            onChange={(priority) => updateDraft({ priority })}
            colored
          />
        </DetailFieldRow>
        <DetailLabelTagsField
          id="feature-labels"
          label="Label"
          value={draft.labels}
          onChange={(labels) => updateDraft({ labels })}
        />
      </DetailPanelSection>
    </form>
  );
}
