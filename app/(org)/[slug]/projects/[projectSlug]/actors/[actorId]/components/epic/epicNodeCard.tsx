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
  WorkItemCardSection,
  WorkItemCardTitle,
  WorkItemFlowCard,
  WorkItemLabelTags,
} from "../model/requirementWorkItemCard";
import { useRequirementsModel } from "../model/requirementsModelContext";
import type { EpicNodeData } from "./epicTypes";

type EpicFlowNode = Node<EpicNodeData, "epic">;

function EpicNodeCardComponent({
  id,
  data,
  selected,
}: NodeProps<EpicFlowNode>) {
  const { selectNode, quickAddFeature, toggleNodeCollapsed, isCreatingFeature } =
    useRequirementsModel();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectNode(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") selectNode(id);
      }}
      className="group/epic"
    >
      <WorkItemFlowCard
        kind="epic"
        selected={selected}
        targetTop
        sourceBottom
        widthClass="w-[280px]"
        footer={
          <div className="flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover/epic:opacity-100">
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
              title="Thêm Feature"
              disabled={isCreatingFeature}
              onClick={(e) => {
                e.stopPropagation();
                quickAddFeature(id);
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

        {data.references.trim() ? (
          <>
            <WorkItemCardDivider />
            <WorkItemCardSection label="References" dot="blue">
              <span className="line-clamp-2">{data.references}</span>
            </WorkItemCardSection>
          </>
        ) : null}
      </WorkItemFlowCard>
    </div>
  );
}

export const EpicNodeCard = memo(EpicNodeCardComponent);
