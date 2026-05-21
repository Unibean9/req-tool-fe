"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ACTOR_EPIC_PRIORITIES } from "@/lib/api/services/fetchActor";
import {
  NFR_CATEGORIES,
  type NfrCategory,
  type NfrPriority,
  type ProjectNfrWriteRequest,
} from "@/lib/api/services/fetchNfr";

import {
  NfrCategoryFilterDisplay,
  NfrCategoryOptionContent,
  NFR_PRIORITY_LABELS_VI,
  nfrPriorityLabel,
} from "./nfrCategoryMeta";
import { NFR_DESCRIPTION_MAX_CHARS } from "./nfrFormLimits";
import { NfrLinkedFeaturesSelect } from "./nfrLinkedFeaturesSelect";

export type NfrFormValues = {
  category: NfrCategory;
  description: string;
  priority: NfrPriority;
  featureIds: string[];
};

export function isNfrFormValid(values: NfrFormValues): boolean {
  return values.description.trim().length > 0;
}

export function trimNfrFormValues(values: NfrFormValues): ProjectNfrWriteRequest {
  return {
    category: values.category,
    description: values.description.trim().slice(0, NFR_DESCRIPTION_MAX_CHARS),
    priority: values.priority,
    featureIds: values.featureIds.map((id) => id.trim()).filter(Boolean),
  };
}

type NfrFormFieldsProps = {
  projectId: string;
  values: NfrFormValues;
  onChange: (patch: Partial<NfrFormValues>) => void;
  disabled?: boolean;
};

export function NfrFormFields({
  projectId,
  values,
  onChange,
  disabled,
}: NfrFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-2">
          <Label htmlFor="nfr-category">Loại NFR</Label>
          <Select
            value={values.category}
            onValueChange={(v) => onChange({ category: v as NfrCategory })}
            disabled={disabled}
          >
            <SelectTrigger id="nfr-category" className="w-full">
              <SelectValue>
                <NfrCategoryFilterDisplay value={values.category} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {NFR_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  <NfrCategoryOptionContent category={c} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="nfr-priority">Độ ưu tiên</Label>
          <Select
            value={values.priority}
            onValueChange={(v) => onChange({ priority: v as NfrPriority })}
            disabled={disabled}
          >
            <SelectTrigger id="nfr-priority" className="w-full">
              <SelectValue>
                {nfrPriorityLabel(values.priority)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ACTOR_EPIC_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {NFR_PRIORITY_LABELS_VI[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="nfr-description">Mô tả NFR</Label>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {values.description.length} / {NFR_DESCRIPTION_MAX_CHARS}
          </span>
        </div>
        <Textarea
          id="nfr-description"
          value={values.description}
          maxLength={NFR_DESCRIPTION_MAX_CHARS}
          disabled={disabled}
          placeholder="Ví dụ: Thời gian phản hồi API ≤ 300ms ở p95…"
          rows={4}
          className="min-h-[6rem] text-sm"
          onChange={(e) =>
            onChange({
              description: e.target.value.slice(0, NFR_DESCRIPTION_MAX_CHARS),
            })
          }
        />
      </div>

      <NfrLinkedFeaturesSelect
        projectId={projectId}
        value={values.featureIds}
        disabled={disabled}
        onChange={(featureIds) => onChange({ featureIds })}
      />
    </div>
  );
}
