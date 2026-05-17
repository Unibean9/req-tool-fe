"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  DetailFieldRow,
  DetailPanelSection,
  DetailPrioritySelect,
  DetailReadOnlyField,
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
  REQ_LABELS_MAX_CHARS,
  REQ_PREFIX_MAX_CHARS,
  REQ_STORY_POINTS_MAX,
  REQ_STORY_POINTS_MIN,
  REQ_TITLE_MAX_CHARS,
  clampStoryPoints,
  clampText,
} from "../model/requirementDetailFormLimits";
import type { AcceptanceCriterion, UserStoryNodeData } from "./storyTypes";
import {
  reindexAcceptanceCriteria,
  STORY_PRIORITIES,
  STORY_STATUSES,
} from "./storyTypes";

export function UserStoryDetailForm({
  data,
  onChange,
  lockedActorRef,
}: {
  data: UserStoryNodeData;
  onChange: (patch: Partial<UserStoryNodeData>) => void;
  lockedActorRef: string;
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
      <DetailPanelSection title="Thông tin chung">
        <DetailFieldRow>
          <DetailTextField
            id="story-prefix"
            label="Mã (prefix)"
            value={data.prefix}
            onChange={(prefix) => onChange({ prefix })}
            maxLength={REQ_PREFIX_MAX_CHARS}
            placeholder="VD: US-01"
            className="font-mono"
          />
          <DetailStatusSelect
            id="story-status"
            label="Trạng thái"
            value={data.status}
            options={STORY_STATUSES}
            onChange={(status) => onChange({ status })}
          />
        </DetailFieldRow>
        <DetailTextField
          id="story-title"
          label="Tiêu đề"
          value={data.title}
          onChange={(title) => onChange({ title })}
          maxLength={REQ_TITLE_MAX_CHARS}
          placeholder="VD: Đăng ký ca làm việc"
        />
        <DetailFieldRow>
          <DetailPrioritySelect
            id="story-priority"
            label="Độ ưu tiên"
            value={data.priority}
            options={STORY_PRIORITIES}
            onChange={(priority) => onChange({ priority })}
          />
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
              placeholder="0"
              onChange={(e) =>
                onChange({
                  story_points: clampStoryPoints(Number(e.target.value)),
                })
              }
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Từ {REQ_STORY_POINTS_MIN} đến {REQ_STORY_POINTS_MAX}.
            </p>
          </div>
        </DetailFieldRow>
      </DetailPanelSection>

      <DetailPanelSection
        title="User story"
        hint="Khớp Action / Goal hiển thị trên thẻ canvas."
      >
        <DetailReadOnlyField
          id="story-actor"
          label="Actor (vai trò)"
          value={lockedActorRef}
          hint="Gắn với actor của workspace này — không đổi trên story."
        />
        <DetailTextAreaField
          id="story-action"
          label="Hành động (I want to…)"
          value={data.action_text}
          onChange={(action_text) => onChange({ action_text })}
          maxLength={REQ_ACTION_TEXT_MAX_CHARS}
          rows={2}
          placeholder="VD: đăng ký ca làm việc trên tuần tới"
        />
        <DetailTextAreaField
          id="story-goal"
          label="Mục tiêu (so that…)"
          value={data.goal_text}
          onChange={(goal_text) => onChange({ goal_text })}
          maxLength={REQ_GOAL_TEXT_MAX_CHARS}
          rows={2}
          placeholder="VD: quản lý được thời gian làm việc linh hoạt"
        />
        <DetailTextAreaField
          id="story-desc"
          label="Mô tả bổ sung"
          value={data.description}
          onChange={(description) => onChange({ description })}
          maxLength={REQ_DESCRIPTION_MAX_CHARS}
          rows={2}
          placeholder="Ngữ cảnh, ràng buộc hoặc ghi chú thêm…"
        />
        <DetailTextField
          id="story-labels"
          label="Nhãn"
          value={data.labels}
          onChange={(labels) => onChange({ labels })}
          maxLength={REQ_LABELS_MAX_CHARS}
          placeholder="VD: sprint-1, must-have"
        />
      </DetailPanelSection>

      <DetailPanelSection
        title="Tiêu chí nghiệm thu"
        hint={`Tối đa ${REQ_ACCEPTANCE_CRITERIA_MAX_COUNT} tiêu chí — tự lưu sau vài giây (mô tả + thứ tự).`}
      >
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
                title="Thứ tự"
              >
                {item.order + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <Input
                  value={item.description}
                  maxLength={REQ_ACCEPTANCE_CRITERION_MAX_CHARS}
                  onChange={(e) =>
                    updateCriterion(i, {
                      description: clampText(
                        e.target.value,
                        REQ_ACCEPTANCE_CRITERION_MAX_CHARS
                      ),
                    })
                  }
                  placeholder={`Tiêu chí ${i + 1} — VD: Hiển thị lỗi khi trùng ca`}
                  className="text-sm"
                />
                <p className="text-[10px] tabular-nums text-muted-foreground">
                  {item.description.length}/{REQ_ACCEPTANCE_CRITERION_MAX_CHARS}
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
                description: "",
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