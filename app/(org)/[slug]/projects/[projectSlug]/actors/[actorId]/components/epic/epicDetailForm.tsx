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
import {
  PANEL_EDITABLE_STATUSES,
  type PanelEditableStatus,
} from "../model/requirementWorkItemLabels";
import type { EpicNodeData, EpicStatus } from "./epicTypes";
import { EPIC_PRIORITIES } from "./epicTypes";

function panelStatusToEpic(status: PanelEditableStatus): EpicStatus {
  if (status === "in_progress") return "active";
  return "draft";
}

/** Chỉ các field trong PATCH `/epics/{id}`: title, description, status, priority, labels. */
export function EpicDetailForm({
  data,
  onChange,
}: {
  data: EpicNodeData;
  onChange: (patch: Partial<EpicNodeData>) => void;
}) {
  return (
    <div className="space-y-6">
      <DetailPanelSection title="Epic">
        <DetailTextField
          id="epic-title"
          label="Tiêu đề"
          value={data.title}
          onChange={(title) => onChange({ title })}
          maxLength={REQ_TITLE_MAX_CHARS}
          placeholder="VD: Quản lý lịch làm việc theo ca"
        />
        <DetailTextAreaField
          id="epic-desc"
          label="Mô tả"
          value={data.description}
          onChange={(description) => onChange({ description })}
          maxLength={REQ_DESCRIPTION_MAX_CHARS}
          rows={4}
          placeholder="Mục tiêu nghiệp vụ, phạm vi và giá trị của epic…"
        />
        <DetailFieldRow>
          <DetailStatusSelect<PanelEditableStatus | EpicStatus>
            id="epic-status"
            label="Trạng thái"
            value={data.status === "active" ? "in_progress" : data.status}
            options={PANEL_EDITABLE_STATUSES}
            onChange={(status) =>
              onChange({
                status: panelStatusToEpic(status as PanelEditableStatus),
              })
            }
            colored
          />
          <DetailPrioritySelect
            id="epic-priority"
            label="Độ ưu tiên"
            value={data.priority}
            options={EPIC_PRIORITIES}
            onChange={(priority) => onChange({ priority })}
            colored
          />
        </DetailFieldRow>
        <DetailLabelTagsField
          id="epic-labels"
          label="Label"
          value={data.labels}
          onChange={(labels) => onChange({ labels })}
        />
      </DetailPanelSection>
    </div>
  );
}
