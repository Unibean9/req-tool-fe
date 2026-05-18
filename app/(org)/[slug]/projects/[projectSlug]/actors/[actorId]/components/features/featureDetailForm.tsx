"use client";

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
import type { FeatureNodeData } from "./featureTypes";
import { FEATURE_PRIORITIES } from "./featureTypes";

/** Chỉ các field trong PATCH `/features/{id}`: title, description, status, priority, labels. */
export function FeatureDetailForm({
  data,
  onChange,
}: {
  data: FeatureNodeData;
  onChange: (patch: Partial<FeatureNodeData>) => void;
}) {
  return (
    <div className="space-y-6">
      <DetailPanelSection title="Feature">
        <DetailTextField
          id="feature-title"
          label="Tiêu đề"
          value={data.title}
          onChange={(title) => onChange({ title })}
          maxLength={REQ_TITLE_MAX_CHARS}
          placeholder="VD: Xem và chỉnh sửa lịch ca"
        />
        <DetailTextAreaField
          id="feature-desc"
          label="Mô tả"
          value={data.description}
          onChange={(description) => onChange({ description })}
          maxLength={REQ_DESCRIPTION_MAX_CHARS}
          rows={4}
          placeholder="Khả năng nghiệp vụ mà feature này cung cấp…"
        />
        <DetailFieldRow>
          <DetailStatusSelect
            id="feature-status"
            label="Trạng thái"
            value={data.status}
            options={PANEL_EDITABLE_STATUSES}
            onChange={(status) => onChange({ status: status })}
            colored
          />
          <DetailPrioritySelect
            id="feature-priority"
            label="Độ ưu tiên"
            value={data.priority}
            options={FEATURE_PRIORITIES}
            onChange={(priority) => onChange({ priority })}
            colored
          />
        </DetailFieldRow>
        <DetailLabelTagsField
          id="feature-labels"
          label="Label"
          value={data.labels}
          onChange={(labels) => onChange({ labels })}
        />
      </DetailPanelSection>
    </div>
  );
}
