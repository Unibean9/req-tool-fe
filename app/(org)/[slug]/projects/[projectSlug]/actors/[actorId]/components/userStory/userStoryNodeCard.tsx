"use client";

import { memo } from "react";
import type { Node, NodeProps } from "@/components/ui/react-flow";

import {
  RequirementPrefixCode,
  RequirementPriorityPill,
  RequirementStatusPill,
  RequirementStoryPointsPill,
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
import type { UserStoryNodeData } from "./storyTypes";

type UserStoryFlowNode = Node<UserStoryNodeData, "userStory">;

function UserStoryNodeCardComponent({
  id,
  data,
  selected,
}: NodeProps<UserStoryFlowNode>) {
  const { selectNode } = useRequirementsModel();

  const description =
    data.description.trim() ||
    (data.actor_ref
      ? `${data.actor_ref} — mô tả ngắn cho story.`
      : "");

  const acTexts = data.acceptance_criteria
    .map((c) => c.description)
    .filter(Boolean);
  const hasBody =
    Boolean(data.action_text.trim()) ||
    Boolean(data.goal_text.trim()) ||
    acTexts.length > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectNode(id)}
      onDoubleClick={() => selectNode(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter") selectNode(id);
      }}
    >
      <WorkItemFlowCard
        kind="userStory"
        selected={selected}
        targetTop
        widthClass="w-[300px]"
      >
        <WorkItemCardHeader>
          <RequirementPrefixCode prefix={data.prefix} />
          <WorkItemCardBadgeRow>
            <RequirementPriorityPill priority={data.priority} />
            <RequirementStatusPill status={data.status} />
            <RequirementStoryPointsPill points={data.story_points} />
          </WorkItemCardBadgeRow>
        </WorkItemCardHeader>

        <div className="mt-2 space-y-2">
          <WorkItemCardTitle>{data.title || "—"}</WorkItemCardTitle>
          {description ? (
            <WorkItemCardDescription className="italic">
              {description}
            </WorkItemCardDescription>
          ) : null}
          <WorkItemLabelTags labels={data.labels} />
        </div>

        {hasBody ? (
          <>
            <WorkItemCardDivider />
            <div className="space-y-3">
              {data.action_text.trim() ? (
                <WorkItemCardSection label="Action" dot="green">
                  {data.action_text}
                </WorkItemCardSection>
              ) : null}
              {data.goal_text.trim() ? (
                <WorkItemCardSection label="Goal" dot="blue">
                  {data.goal_text}
                </WorkItemCardSection>
              ) : null}
              {acTexts.length > 0 ? (
                <WorkItemCardSection label="Acceptance criteria" dot="purple">
                  <WorkItemCardList items={acTexts} max={3} />
                </WorkItemCardSection>
              ) : null}
            </div>
          </>
        ) : null}
      </WorkItemFlowCard>
    </div>
  );
}

export const UserStoryNodeCard = memo(UserStoryNodeCardComponent);
