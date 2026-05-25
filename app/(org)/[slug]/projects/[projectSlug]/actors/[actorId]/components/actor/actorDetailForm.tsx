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
      <DetailPanelSection title="Information">
        <DetailTextField
          id="actor-title"
          label="Actor name"
          value={data.title}
          onChange={(title) => onChange({ title })}
          maxLength={REQ_ACTOR_TITLE_MAX_CHARS}
          placeholder="e.g. Shift Employee"
        />
        <DetailTextAreaField
          id="actor-desc"
          label="Short description"
          value={data.description}
          onChange={(description) => onChange({ description })}
          maxLength={REQ_ACTOR_DESCRIPTION_MAX_CHARS}
          rows={2}
          placeholder="Brief role summary on the diagram…"
        />
      </DetailPanelSection>
      <DetailPanelSection title="Role">
        <DetailTextAreaField
          id="actor-role"
          label="Role description"
          value={data.roleDescription ?? ""}
          onChange={(roleDescription) => onChange({ roleDescription })}
          maxLength={REQ_ACTOR_ROLE_MAX_CHARS}
          rows={3}
          placeholder="e.g. Registers and tracks their own work shifts"
        />
      </DetailPanelSection>
    </div>
  );
}
