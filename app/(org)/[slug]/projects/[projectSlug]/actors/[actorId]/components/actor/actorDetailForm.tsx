"use client";

import {
  DetailPanelSection,
  DetailTextAreaField,
  DetailTextField,
} from "../model/requirementDetailPanelUi";
import {
  REQ_ACTOR_DESCRIPTION_MAX_CHARS,
  REQ_ACTOR_ROLE_MAX_CHARS,
  REQ_ACTOR_TITLE_MAX_CHARS,
} from "../model/requirementDetailFormLimits";
import type { ActorNodeData } from "../model/requirementsModelTypes";

export function ActorDetailForm({
  data,
  onChange,
}: {
  data: ActorNodeData;
  onChange: (patch: Partial<ActorNodeData>) => void;
}) {
  return (
    <div className="space-y-6">
      <DetailPanelSection title="Thông tin">
        <DetailTextField
          id="actor-title"
          label="Tên actor"
          value={data.title}
          onChange={(title) => onChange({ title })}
          maxLength={REQ_ACTOR_TITLE_MAX_CHARS}
          placeholder="VD: Nhân viên ca"
        />
        <DetailTextAreaField
          id="actor-desc"
          label="Mô tả ngắn"
          value={data.description}
          onChange={(description) => onChange({ description })}
          maxLength={REQ_ACTOR_DESCRIPTION_MAX_CHARS}
          rows={2}
          placeholder="Vai trò tóm tắt trên sơ đồ…"
        />
      </DetailPanelSection>
      <DetailPanelSection title="Vai trò">
        <DetailTextAreaField
          id="actor-role"
          label="Mô tả vai trò"
          value={data.roleDescription ?? ""}
          onChange={(roleDescription) => onChange({ roleDescription })}
          maxLength={REQ_ACTOR_ROLE_MAX_CHARS}
          rows={3}
          placeholder="VD: Người đăng ký và theo dõi ca làm việc của bản thân"
        />
      </DetailPanelSection>
    </div>
  );
}
