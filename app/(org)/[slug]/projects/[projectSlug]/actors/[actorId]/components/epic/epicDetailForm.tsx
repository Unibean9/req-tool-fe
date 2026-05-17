"use client";

import {
  DetailFieldRow,
  DetailPanelSection,
  DetailPrioritySelect,
  DetailStatusSelect,
  DetailTextAreaField,
  DetailTextField,
} from "../model/requirementDetailPanelUi";
import {
  REQ_DESCRIPTION_MAX_CHARS,
  REQ_LABELS_MAX_CHARS,
  REQ_PREFIX_MAX_CHARS,
  REQ_REFERENCES_MAX_CHARS,
  REQ_TITLE_MAX_CHARS,
} from "../model/requirementDetailFormLimits";
import type { EpicNodeData } from "./epicTypes";
import { EPIC_PRIORITIES, EPIC_STATUSES } from "./epicTypes";

export function EpicDetailForm({
  data,
  onChange,
}: {
  data: EpicNodeData;
  onChange: (patch: Partial<EpicNodeData>) => void;
}) {
  return (
    <div className="space-y-6">
      <DetailPanelSection
        title="Thông tin chung"
        hint="Mã và trạng thái thường do hệ thống gán; bạn có thể chỉnh khi cần."
      >
        <DetailFieldRow>
          <DetailTextField
            id="epic-prefix"
            label="Mã (prefix)"
            value={data.prefix}
            onChange={(prefix) => onChange({ prefix })}
            maxLength={REQ_PREFIX_MAX_CHARS}
            placeholder="VD: EPIC-01"
            className="font-mono"
          />
          <DetailStatusSelect
            id="epic-status"
            label="Trạng thái"
            value={data.status}
            options={EPIC_STATUSES}
            onChange={(status) => onChange({ status })}
          />
        </DetailFieldRow>
        <DetailTextField
          id="epic-title"
          label="Tiêu đề"
          value={data.title}
          onChange={(title) => onChange({ title })}
          maxLength={REQ_TITLE_MAX_CHARS}
          placeholder="VD: Quản lý lịch làm việc theo ca"
        />
        <DetailPrioritySelect
          id="epic-priority"
          label="Độ ưu tiên"
          value={data.priority}
          options={EPIC_PRIORITIES}
          onChange={(priority) => onChange({ priority })}
        />
      </DetailPanelSection>

      <DetailPanelSection title="Mô tả & phân loại">
        <DetailTextAreaField
          id="epic-desc"
          label="Mô tả"
          value={data.description}
          onChange={(description) => onChange({ description })}
          maxLength={REQ_DESCRIPTION_MAX_CHARS}
          rows={4}
          placeholder="Mục tiêu nghiệp vụ, phạm vi và giá trị của epic…"
        />
        <DetailTextField
          id="epic-labels"
          label="Nhãn"
          value={data.labels}
          onChange={(labels) => onChange({ labels })}
          maxLength={REQ_LABELS_MAX_CHARS}
          placeholder="VD: vận hành, lịch ca (phân tách bằng dấu phẩy)"
          hint="Nhiều nhãn cách nhau bởi dấu phẩy."
        />
      </DetailPanelSection>

      <DetailPanelSection title="Tham chiếu">
        <DetailTextAreaField
          id="epic-refs"
          label="Tài liệu / liên kết"
          value={data.references}
          onChange={(references) => onChange({ references })}
          maxLength={REQ_REFERENCES_MAX_CHARS}
          rows={2}
          placeholder="VD: link Confluence, ticket Jira, ghi chú nguồn…"
        />
      </DetailPanelSection>
    </div>
  );
}
