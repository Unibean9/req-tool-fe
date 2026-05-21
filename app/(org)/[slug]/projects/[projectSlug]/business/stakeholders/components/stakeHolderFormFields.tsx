"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  STAKEHOLDER_INFLUENCE_LEVELS,
  type StakeholderInfluenceLevel,
} from "@/lib/api/services/fetchStakeHolder";
import { cn } from "@/lib/utils";

import {
  STAKEHOLDER_IMPACT_AREA_MAX_CHARS,
  STAKEHOLDER_NAME_MAX_CHARS,
  STAKEHOLDER_NOTES_MAX_CHARS,
  STAKEHOLDER_ROLE_MAX_CHARS,
} from "./stakeHolderFormLimits";
import { StakeHolderBusinessActorField } from "./stakeHolderBusinessActorField";

const IMPACT_AREA_TAG_SEPARATOR = " · ";
const IMPACT_AREA_SPLIT = /\s*(?:·|,|;)\s*/;

const INFLUENCE_LEVEL_LABELS: Record<StakeholderInfluenceLevel, string> = {
  high: "Cao (High)",
  medium: "Trung bình (Medium)",
  low: "Thấp (Low)",
};

export function parseImpactAreaTags(raw: string): string[] {
  if (!raw.trim()) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(IMPACT_AREA_SPLIT)) {
    const tag = part.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

function serializeImpactAreaTags(tags: readonly string[]): string {
  let result = "";
  const seen = new Set<string>();
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const next = result
      ? `${result}${IMPACT_AREA_TAG_SEPARATOR}${tag}`
      : tag;
    if (next.length > STAKEHOLDER_IMPACT_AREA_MAX_CHARS) break;
    result = next;
  }
  return result.slice(0, STAKEHOLDER_IMPACT_AREA_MAX_CHARS);
}

function impactAreaTagsFromDraft(
  existing: readonly string[],
  draft: string
): string[] {
  const parts = draft
    .split(IMPACT_AREA_SPLIT)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return [...existing];
  return [...existing, ...parts];
}

export type StakeHolderFormValues = {
  name: string;
  role: string;
  impactArea: string;
  influenceLevel: StakeholderInfluenceLevel;
  notes: string;
  isBusinessActor: boolean;
};

type StakeHolderFormFieldsProps = {
  values: StakeHolderFormValues;
  onChange: (patch: Partial<StakeHolderFormValues>) => void;
  disabled?: boolean;
  idPrefix?: string;
};

export function StakeHolderFormFields({
  values,
  onChange,
  disabled = false,
  idPrefix = "stakeholder",
}: StakeHolderFormFieldsProps) {
  return (
    <div className="grid gap-3 px-1 py-2">
      <StakeholderField
        id={`${idPrefix}-name`}
        label="Tên"
        max={STAKEHOLDER_NAME_MAX_CHARS}
        value={values.name}
        onChange={(name) => onChange({ name })}
        placeholder="VD: Product Owner"
        disabled={disabled}
      />
      <StakeholderField
        id={`${idPrefix}-role`}
        label="Vai trò"
        max={STAKEHOLDER_ROLE_MAX_CHARS}
        value={values.role}
        onChange={(role) => onChange({ role })}
        placeholder="VD: Quyết định ưu tiên backlog"
        disabled={disabled}
      />
      <ImpactAreaTagInput
        id={`${idPrefix}-impact`}
        value={values.impactArea}
        onChange={(impactArea) => onChange({ impactArea })}
        disabled={disabled}
      />
      <InfluenceLevelField
        id={`${idPrefix}-influence`}
        value={values.influenceLevel}
        onChange={(influenceLevel) => onChange({ influenceLevel })}
        disabled={disabled}
      />
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={`${idPrefix}-notes`} className="text-sm font-semibold">
            Ghi chú
          </Label>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {values.notes.length}/{STAKEHOLDER_NOTES_MAX_CHARS}
          </span>
        </div>
        <Textarea
          id={`${idPrefix}-notes`}
          value={values.notes}
          onChange={(e) =>
            onChange({
              notes: e.target.value.slice(0, STAKEHOLDER_NOTES_MAX_CHARS),
            })
          }
          placeholder="VD: Xác nhận yêu cầu và ký off từng sprint."
          disabled={disabled}
          rows={3}
          className="resize-none"
        />
      </div>
      <StakeHolderBusinessActorField
        id={`${idPrefix}-business-actor`}
        checked={values.isBusinessActor}
        onChange={(isBusinessActor) => onChange({ isBusinessActor })}
        disabled={disabled}
      />
    </div>
  );
}

function ImpactAreaTagInput({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (impactArea: string) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState("");
  const tags = useMemo(() => parseImpactAreaTags(value), [value]);
  const atMaxLength = value.length >= STAKEHOLDER_IMPACT_AREA_MAX_CHARS;

  function commitTags(nextTags: string[]) {
    onChange(serializeImpactAreaTags(nextTags));
  }

  function removeTag(index: number) {
    commitTags(tags.filter((_, i) => i !== index));
  }

  function addFromDraft() {
    const trimmed = draft.trim();
    if (!trimmed || disabled || atMaxLength) return;
    const next = serializeImpactAreaTags(impactAreaTagsFromDraft(tags, trimmed));
    if (next.length <= STAKEHOLDER_IMPACT_AREA_MAX_CHARS) {
      onChange(next);
      setDraft("");
    }
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-semibold">
          Vùng tác động (Impact area)
        </Label>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {value.length}/{STAKEHOLDER_IMPACT_AREA_MAX_CHARS}
        </span>
      </div>
      <div
        className={cn(
          "rounded-lg border border-input bg-background px-2.5 py-2 shadow-xs transition-colors",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        {tags.length > 0 ? (
          <ul className="mb-2 flex list-none flex-wrap gap-1.5">
            {tags.map((tag, index) => (
              <li key={`${tag}-${index}`}>
                <span className="inline-flex max-w-full items-center gap-0.5 rounded-md border border-border/80 bg-muted/50 py-0.5 pr-0.5 pl-2 text-xs text-foreground/90">
                  <span className="truncate">{tag}</span>
                  <button
                    type="button"
                    className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Xóa tag ${tag}`}
                    disabled={disabled}
                    onClick={() => removeTag(index)}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <Input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addFromDraft();
            }
            if (e.key === "Backspace" && !draft && tags.length > 0) {
              removeTag(tags.length - 1);
            }
          }}
          onBlur={() => addFromDraft()}
          disabled={disabled || atMaxLength}
          placeholder="VD: Backlog, Sprint planning — Enter để thêm"
          className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

function InfluenceLevelField({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: StakeholderInfluenceLevel;
  onChange: (level: StakeholderInfluenceLevel) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        Mức ảnh hưởng (Influence level)
      </Label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (
            v != null &&
            (STAKEHOLDER_INFLUENCE_LEVELS as readonly string[]).includes(v)
          ) {
            onChange(v as StakeholderInfluenceLevel);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="h-10 w-full text-sm">
          <SelectValue placeholder="Chọn mức ảnh hưởng (Influence level)" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {STAKEHOLDER_INFLUENCE_LEVELS.map((level) => (
            <SelectItem key={level} value={level}>
              {INFLUENCE_LEVEL_LABELS[level]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StakeholderField({
  id,
  label,
  max,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  max: number;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
        </Label>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {value.length}/{max}
        </span>
      </div>
      <Input
        id={id}
        autoComplete="off"
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10"
      />
    </div>
  );
}

export function trimStakeHolderFormValues(values: StakeHolderFormValues) {
  return {
    name: values.name.trim().slice(0, STAKEHOLDER_NAME_MAX_CHARS),
    role: values.role.trim().slice(0, STAKEHOLDER_ROLE_MAX_CHARS),
    impactArea: values.impactArea.trim().slice(0, STAKEHOLDER_IMPACT_AREA_MAX_CHARS),
    influenceLevel: values.influenceLevel,
    notes: values.notes.trim().slice(0, STAKEHOLDER_NOTES_MAX_CHARS),
    isBusinessActor: values.isBusinessActor,
  };
}

export function isStakeHolderFormValid(values: StakeHolderFormValues): boolean {
  return (
    values.name.trim().length > 0 &&
    values.role.trim().length > 0 &&
    parseImpactAreaTags(values.impactArea).length > 0
  );
}
