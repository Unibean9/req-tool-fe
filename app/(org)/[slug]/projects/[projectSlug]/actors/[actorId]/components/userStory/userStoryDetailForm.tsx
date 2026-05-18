"use client";

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
import type { AcceptanceCriterion, UserStoryNodeData } from "./storyTypes";
import { PANEL_EDITABLE_STATUSES } from "../model/requirementWorkItemLabels";
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

/**
 * Chỉ các field trong PATCH `/user-stories/{id}`:
 * title, description, action_text, goal_text, status, priority,
 * labels, story_points, business_value, acceptance_criteria.
 */
export function UserStoryDetailForm({
  data,
  onChange,
}: {
  data: UserStoryNodeData;
  onChange: (patch: Partial<UserStoryNodeData>) => void;
}) {
  const criteria = data.acceptance_criteria;
  const canAddCriterion = criteria.length < REQ_ACCEPTANCE_CRITERIA_MAX_COUNT;

  const setCriteria = (next: AcceptanceCriterion[]) => {
    onChange({ acceptance_criteria: reindexAcceptanceCriteria(next) });
  };

  const updateCriterion = (
    index: number,
    patch: Partial<AcceptanceCriterion>
  ) => {
    setCriteria(
      criteria.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  return (
    <div className="space-y-6">
      <DetailPanelSection title="User story">
        <DetailTextField
          id="story-title"
          label="Tiêu đề"
          value={data.title}
          onChange={(title) => onChange({ title })}
          maxLength={REQ_TITLE_MAX_CHARS}
          placeholder="VD: Đăng ký ca làm việc"
        />
        <DetailTextAreaField
          id="story-desc"
          label="Mô tả"
          value={data.description}
          onChange={(description) => onChange({ description })}
          maxLength={REQ_DESCRIPTION_MAX_CHARS}
          rows={3}
          placeholder="Ngữ cảnh, ràng buộc hoặc ghi chú thêm…"
        />
        <DetailTextAreaField
          id="story-action"
          label="Hành động (action_text)"
          value={data.action_text}
          onChange={(action_text) => onChange({ action_text })}
          maxLength={REQ_ACTION_TEXT_MAX_CHARS}
          rows={2}
          placeholder="VD: đăng ký ca làm việc trên tuần tới"
        />
        <DetailTextAreaField
          id="story-goal"
          label="Mục tiêu (goal_text)"
          value={data.goal_text}
          onChange={(goal_text) => onChange({ goal_text })}
          maxLength={REQ_GOAL_TEXT_MAX_CHARS}
          rows={2}
          placeholder="VD: quản lý được thời gian làm việc linh hoạt"
        />
        <DetailFieldRow>
          <DetailStatusSelect
            id="story-status"
            label="Trạng thái"
            value={data.status}
            options={PANEL_EDITABLE_STATUSES}
            onChange={(status) => onChange({ status })}
            colored
          />
          <DetailPrioritySelect
            id="story-priority"
            label="Độ ưu tiên"
            value={data.priority}
            options={STORY_PRIORITIES}
            onChange={(priority) => onChange({ priority })}
            colored
          />
        </DetailFieldRow>
        <DetailLabelTagsField
          id="story-labels"
          label="Label"
          value={data.labels}
          onChange={(labels) => onChange({ labels })}
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
              value={data.story_points}
              onChange={(e) =>
                onChange({
                  story_points: clampStoryPoints(Number(e.target.value)),
                })
              }
              className="text-sm tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="story-business-value" className="text-sm font-medium">
              Business value
            </Label>
            <Input
              id="story-business-value"
              type="number"
              min={REQ_BUSINESS_VALUE_MIN}
              max={REQ_BUSINESS_VALUE_MAX}
              value={data.business_value}
              onChange={(e) =>
                onChange({
                  business_value: clampBusinessValue(Number(e.target.value)),
                })
              }
              className="text-sm tabular-nums"
            />
          </div>
        </DetailFieldRow>
      </DetailPanelSection>

      <DetailPanelSection title="Acceptance Criteria">
        {criteria.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Chưa có tiêu chí. Bấm &quot;Thêm tiêu chí&quot; bên dưới.
          </p>
        ) : null}
        <ul className="space-y-2">
          {criteria.map((item, i) => (
            <li key={item.id} className="flex items-start gap-2">
              <span
                className="mt-2 flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50 text-[10px] font-medium tabular-nums text-muted-foreground"
                title="Thứ tự (order)"
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
                  placeholder={`Tiêu chí ${i + 1}`}
                  className="text-sm"
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
                title="Xóa tiêu chí"
                onClick={() =>
                  setCriteria(criteria.filter((_, j) => j !== i))
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
          onClick={() =>
            setCriteria([
              ...criteria,
              {
                id: crypto.randomUUID(),
                label: "",
                order: criteria.length,
              },
            ])
          }
        >
          <Plus className="size-3.5" />
          Thêm tiêu chí
        </Button>
        {!canAddCriterion ? (
          <p className="text-[11px] text-muted-foreground">
            Đã đạt giới hạn {REQ_ACCEPTANCE_CRITERIA_MAX_COUNT} tiêu chí.
          </p>
        ) : null}
      </DetailPanelSection>
    </div>
  );
}
