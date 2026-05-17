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
  REQ_NFR_NOTE_MAX_CHARS,
  REQ_PREFIX_MAX_CHARS,
  REQ_REFERENCES_MAX_CHARS,
  REQ_TITLE_MAX_CHARS,
} from "../model/requirementDetailFormLimits";
import type { FeatureNodeData } from "./featureTypes";
import { FEATURE_PRIORITIES, FEATURE_STATUSES } from "./featureTypes";

export function FeatureDetailForm({
  data,
  onChange,
}: {
  data: FeatureNodeData;
  onChange: (patch: Partial<FeatureNodeData>) => void;
}) {
  return (
    <div className="space-y-6">
      <DetailPanelSection title="Thông tin chung">
        <DetailFieldRow>
          <DetailTextField
            id="feature-prefix"
            label="Mã (prefix)"
            value={data.prefix}
            onChange={(prefix) => onChange({ prefix })}
            maxLength={REQ_PREFIX_MAX_CHARS}
            placeholder="VD: FEAT-01"
            className="font-mono"
          />
          <DetailStatusSelect
            id="feature-status"
            label="Trạng thái"
            value={data.status}
            options={FEATURE_STATUSES}
            onChange={(status) => onChange({ status })}
          />
        </DetailFieldRow>
        <DetailTextField
          id="feature-title"
          label="Tiêu đề"
          value={data.title}
          onChange={(title) => onChange({ title })}
          maxLength={REQ_TITLE_MAX_CHARS}
          placeholder="VD: Xem và chỉnh sửa lịch ca"
        />
        <DetailPrioritySelect
          id="feature-priority"
          label="Độ ưu tiên"
          value={data.priority}
          options={FEATURE_PRIORITIES}
          onChange={(priority) => onChange({ priority })}
        />
      </DetailPanelSection>

      <DetailPanelSection title="Mô tả & yêu cầu phi chức năng">
        <DetailTextAreaField
          id="feature-desc"
          label="Mô tả"
          value={data.description}
          onChange={(description) => onChange({ description })}
          maxLength={REQ_DESCRIPTION_MAX_CHARS}
          rows={3}
          placeholder="Khả năng nghiệp vụ mà feature này cung cấp…"
        />
        <DetailTextAreaField
          id="feature-nfr"
          label="Ghi chú NFR"
          value={data.nfr_note}
          onChange={(nfr_note) => onChange({ nfr_note })}
          maxLength={REQ_NFR_NOTE_MAX_CHARS}
          rows={2}
          placeholder="VD: P95 phản hồi dưới 2 giây, hỗ trợ 50 ca/tuần…"
          hint="Non-functional requirement — giúp tránh cảnh báo khi để trống."
        />
        <DetailTextField
          id="feature-labels"
          label="Nhãn"
          value={data.labels}
          onChange={(labels) => onChange({ labels })}
          maxLength={REQ_LABELS_MAX_CHARS}
          placeholder="VD: mobile, api (phân tách bằng dấu phẩy)"
        />
      </DetailPanelSection>

      <DetailPanelSection title="Tham chiếu">
        <DetailTextAreaField
          id="feature-refs"
          label="Tài liệu / liên kết"
          value={data.references}
          onChange={(references) => onChange({ references })}
          maxLength={REQ_REFERENCES_MAX_CHARS}
          rows={2}
          placeholder="VD: mockup Figma, API spec…"
        />
      </DetailPanelSection>
    </div>
  );
}
