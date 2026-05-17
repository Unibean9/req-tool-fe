"use client";

import { memo } from "react";
import { Minus, Plus } from "lucide-react";
import type { Node, NodeProps } from "@/components/ui/react-flow";
import { Button } from "@/components/ui/button";

import {
  RequirementPrefixCode,
  RequirementPriorityPill,
  RequirementStatusPill,
} from "../model/requirementWorkItemBadges";
import {
  WorkItemCardBadgeRow,
  WorkItemCardDescription,
  WorkItemCardDivider,
  WorkItemCardHeader,
  WorkItemCardList,
  WorkItemCardSection,
  WorkItemCardTitle,
  WorkItemFlowCard,
  WorkItemLabelTags,
} from "../model/requirementWorkItemCard";
import { useRequirementsModel } from "../model/requirementsModelContext";
import type { FeatureNodeData } from "./featureTypes";

type FeatureFlowNode = Node<FeatureNodeData, "feature">;

function FeatureNodeCardComponent({
  id,
  data,
  selected,
}: NodeProps<FeatureFlowNode>) {
  const {
    selectNode,
    quickAddUserStory,
    toggleNodeCollapsed,
    isCreatingUserStory,
  } = useRequirementsModel();
  const hasWarnings = data.warnings.length > 0;
  const hasExtra = Boolean(data.nfr_note.trim()) || hasWarnings;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectNode(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") selectNode(id);
      }}
      className="group/feature"
    >
      <WorkItemFlowCard
        kind="feature"
        selected={selected}
        targetTop
        sourceBottom
        widthClass="w-[280px]"
        footer={
          <div className="flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover/feature:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-7"
              title={data.collapsed ? "Mở rộng" : "Thu gọn"}
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeCollapsed(id);
              }}
            >
              <Minus className="size-3.5" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon-xs"
              className="size-7"
              title="Thêm User Story"
              disabled={isCreatingUserStory}
              onClick={(e) => {
                e.stopPropagation();
                quickAddUserStory(id);
              }}
            >
              <Plus className="size-3.5" aria-hidden />
            </Button>
          </div>
        }
      >
        <WorkItemCardHeader>
          <RequirementPrefixCode prefix={data.prefix} />
          <WorkItemCardBadgeRow>
            <RequirementPriorityPill priority={data.priority} />
            <RequirementStatusPill status={data.status} />
          </WorkItemCardBadgeRow>
        </WorkItemCardHeader>

        <div className="mt-2 space-y-2">
          <WorkItemCardTitle>{data.title || "—"}</WorkItemCardTitle>
          {data.description ? (
            <WorkItemCardDescription>{data.description}</WorkItemCardDescription>
          ) : null}
          <WorkItemLabelTags labels={data.labels} />
        </div>

        {hasExtra ? (
          <>
            <WorkItemCardDivider />
            <div className="space-y-3">
              {data.nfr_note.trim() ? (
                <WorkItemCardSection label="NFR" dot="amber">
                  {data.nfr_note}
                </WorkItemCardSection>
              ) : null}
              {hasWarnings ? (
                <WorkItemCardSection label="Warnings" dot="rose">
                  <WorkItemCardList items={data.warnings} max={2} />
                </WorkItemCardSection>
              ) : null}
            </div>
          </>
        ) : null}
      </WorkItemFlowCard>
    </div>
  );
}

export const FeatureNodeCard = memo(FeatureNodeCardComponent);
