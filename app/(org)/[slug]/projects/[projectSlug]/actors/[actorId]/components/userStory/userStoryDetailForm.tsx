"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  REQ_ACCEPTANCE_CRITERIA_MAX_COUNT,
  REQ_ACCEPTANCE_CRITERION_MAX_CHARS,
  REQ_ACTION_TEXT_MAX_CHARS,
  REQ_DESCRIPTION_MAX_CHARS,
  REQ_GOAL_TEXT_MAX_CHARS,
  REQ_STORY_POINTS_MAX,
  REQ_STORY_POINTS_MIN,
  REQ_TITLE_MAX_CHARS,
  clampStoryPoints,
  clampText,
} from "../model/requirementDetailFormLimits";
import {
  PANEL_EDITABLE_STATUSES,
  type PanelEditableStatus,
} from "../model/requirementWorkItemLabels";
import type {
  AcceptanceCriterion,
  StoryPriority,
  StoryStatus,
  UserStoryNodeData,
} from "./storyTypes";
import { reindexAcceptanceCriteria, STORY_PRIORITIES } from "./storyTypes";

const REQ_BUSINESS_VALUE_MIN = 0;
const REQ_BUSINESS_VALUE_MAX = 999;

function clampBusinessValue(value: number): number {
  if (!Number.isFinite(value)) return REQ_BUSINESS_VALUE_MIN;
  return Math.min(
    REQ_BUSINESS_VALUE_MAX,
    Math.max(REQ_BUSINESS_VALUE_MIN, Math.round(value))
  );
}

type UserStoryDraft = {
  title: string;
  description: string;
  action_text: string;
  goal_text: string;
  status: PanelEditableStatus | StoryStatus;
  priority: StoryPriority;
  labels: string;
  story_points: number;
  business_value: number;
  acceptance_criteria: AcceptanceCriterion[];
};

function draftFromStory(data: UserStoryNodeData): UserStoryDraft {
  return {
    title: data.title,
    description: data.description,
    action_text: data.action_text,
    goal_text: data.goal_text,
    status: data.status,
    priority: data.priority,
    labels: data.labels,
    story_points: data.story_points,
    business_value: data.business_value,
    acceptance_criteria: data.acceptance_criteria,
  };
}

function sameStoryDraft(a: UserStoryDraft, b: UserStoryDraft): boolean {
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.action_text === b.action_text &&
    a.goal_text === b.goal_text &&
    a.status === b.status &&
    a.priority === b.priority &&
    a.labels === b.labels &&
    a.story_points === b.story_points &&
    a.business_value === b.business_value &&
    JSON.stringify(a.acceptance_criteria) === JSON.stringify(b.acceptance_criteria)
  );
}

/**
 * Chỉ các field trong PATCH `/user-stories/{id}`:
 * title, description, action_text, goal_text, status, priority,
 * labels, story_points, business_value, acceptance_criteria.
 */
export function UserStoryDetailForm({
  data,
  onChange,
  isSaving,
  formId,
}: {
  data: UserStoryNodeData;
  onChange: (patch: Partial<UserStoryNodeData>) => void;
  isSaving?: boolean;
  formId: string;
}) {
  const [baseDraft, setBaseDraft] = useState<UserStoryDraft>(() =>
    draftFromStory(data)
  );
  const [draft, setDraft] = useState<UserStoryDraft>(() =>
    draftFromStory(data)
  );
  const dirty = !sameStoryDraft(draft, baseDraft);
  const criteria = draft.acceptance_criteria;
  const canAddCriterion = criteria.length < REQ_ACCEPTANCE_CRITERIA_MAX_COUNT;

  function updateDraft(patch: Partial<UserStoryDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  const setCriteria = (
    next:
      | AcceptanceCriterion[]
      | ((prev: AcceptanceCriterion[]) => AcceptanceCriterion[])
  ) => {
    setDraft((prev) => {
      const criteria =
        typeof next === "function" ? next(prev.acceptance_criteria) : next;
      return {
        ...prev,
        acceptance_criteria: reindexAcceptanceCriteria(criteria),
      };
    });
  };

  const updateCriterion = (
    index: number,
    patch: Partial<AcceptanceCriterion>
  ) => {
    setCriteria(
      criteria.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!dirty || isSaving) return;
    onChange({
      title: draft.title,
      description: draft.description,
      action_text: draft.action_text,
      goal_text: draft.goal_text,
      status: draft.status,
      priority: draft.priority,
      labels: draft.labels,
      story_points: draft.story_points,
      business_value: draft.business_value,
      acceptance_criteria: draft.acceptance_criteria,
    });
    setBaseDraft(draft);
  }

  function addCriterion() {
    setCriteria((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: "",
        order: prev.length,
      },
    ]);
  }

  return (
    <form
      id={formId}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]"
      onSubmit={submit}
    >
      <div className="min-w-0 space-y-4">
          <DetailTextField
            id="story-title"
            label="Title"
            value={draft.title}
            onChange={(title) => updateDraft({ title })}
            maxLength={REQ_TITLE_MAX_CHARS}
            placeholder="e.g. Register for a work shift"
          />
          <DetailTextAreaField
            id="story-desc"
            label="Description"
            value={draft.description}
            onChange={(description) => updateDraft({ description })}
            maxLength={REQ_DESCRIPTION_MAX_CHARS}
            rows={3}
            placeholder="Context, constraints, or additional notes…"
          />
          <DetailTextAreaField
            id="story-action"
            label="Action"
            value={draft.action_text}
            onChange={(action_text) => updateDraft({ action_text })}
            maxLength={REQ_ACTION_TEXT_MAX_CHARS}
            rows={2}
            placeholder="e.g. register for a shift next week"
          />
          <DetailTextAreaField
            id="story-goal"
            label="Goal"
            value={draft.goal_text}
            onChange={(goal_text) => updateDraft({ goal_text })}
            maxLength={REQ_GOAL_TEXT_MAX_CHARS}
            rows={2}
            placeholder="e.g. manage their working hours flexibly"
          />
          <DetailFieldRow>
            <DetailStatusSelect
              id="story-status"
              label="Status"
              value={draft.status}
              options={PANEL_EDITABLE_STATUSES}
              onChange={(status) => updateDraft({ status })}
              colored
            />
            <DetailPrioritySelect
              id="story-priority"
              label="Priority"
              value={draft.priority}
              options={STORY_PRIORITIES}
              onChange={(priority) => updateDraft({ priority })}
              colored
            />
          </DetailFieldRow>
          <DetailLabelTagsField
            id="story-labels"
            label="Label"
            value={draft.labels}
            onChange={(labels) => updateDraft({ labels })}
          />
          <DetailFieldRow>
            <div className="space-y-2">
              <Label htmlFor="story-points" className="text-sm font-medium">
                Story points
              </Label>
              <Input
                id="story-points"
                type="number"
                min={REQ_STORY_POINTS_MIN}
                max={REQ_STORY_POINTS_MAX}
                value={draft.story_points}
                onChange={(e) =>
                  updateDraft({
                    story_points: clampStoryPoints(Number(e.target.value)),
                  })
                }
                className="border-border/80 bg-muted/30 text-sm tabular-nums"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="story-business-value"
                className="text-sm font-medium"
              >
                Business value
              </Label>
              <Input
                id="story-business-value"
                type="number"
                min={REQ_BUSINESS_VALUE_MIN}
                max={REQ_BUSINESS_VALUE_MAX}
                value={draft.business_value}
                onChange={(e) =>
                  updateDraft({
                    business_value: clampBusinessValue(Number(e.target.value)),
                  })
                }
                className="border-border/80 bg-muted/30 text-sm tabular-nums"
              />
            </div>
          </DetailFieldRow>
      </div>

      <div className="min-w-0 border-t border-border/70 pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
        <DetailPanelSection
          title="Acceptance Criteria"
        >
          {criteria.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-5 text-center text-xs text-muted-foreground">
              No criteria yet. Click &quot;Add criterion&quot; below.
            </p>
          ) : null}
          <ul className="space-y-2">
            {criteria.map((item, i) => (
              <li key={item.id} className="flex items-start gap-2">
                <span
                  className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-[10px] font-medium tabular-nums text-muted-foreground"
                  title="Order"
                >
                  {item.order + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <Input
                    value={item.label}
                    maxLength={REQ_ACCEPTANCE_CRITERION_MAX_CHARS}
                    onChange={(e) =>
                      updateCriterion(i, {
                        label: clampText(
                          e.target.value,
                          REQ_ACCEPTANCE_CRITERION_MAX_CHARS
                        ),
                      })
                    }
                    placeholder={`Criterion ${i + 1}`}
                    className="border-border/80 bg-muted/30 text-sm"
                  />
                  <p className="text-[10px] tabular-nums text-muted-foreground">
                    {item.label.length}/{REQ_ACCEPTANCE_CRITERION_MAX_CHARS}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="size-8 shrink-0"
                  title="Remove criterion"
                  onClick={() =>
                    setCriteria((prev) => prev.filter((_, j) => j !== i))
                  }
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            disabled={!canAddCriterion}
            onClick={addCriterion}
          >
            <Plus className="size-3.5" />
            Add criterion
          </Button>
          {!canAddCriterion ? (
            <p className="text-[11px] text-muted-foreground">
              Reached the limit of {REQ_ACCEPTANCE_CRITERIA_MAX_COUNT} criteria.
            </p>
          ) : null}
        </DetailPanelSection>
      </div>
    </form>
  );
}
