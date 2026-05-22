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
import { OUT_OF_SCOPE_CATEGORIES } from "@/lib/api/services/fetchOutOfScope";
import type { OutOfScopeCategory } from "@/lib/api/services/fetchOutOfScope";

export const OUT_OF_SCOPE_CATEGORY_LABELS: Record<OutOfScopeCategory, string> =
  {
    feature: "Feature",
    integration: "Integration",
    user_group: "User Group",
    process: "Process",
    technical: "Technical",
  };

export type OutOfScopeFormValues = {
  category: OutOfScopeCategory;
  description: string;
  order: number;
};

export const EMPTY_OUT_OF_SCOPE_FORM: OutOfScopeFormValues = {
  category: "feature",
  description: "",
  order: 0,
};

export function isOutOfScopeFormValid(values: OutOfScopeFormValues): boolean {
  return values.description.trim().length > 0;
}

export function trimOutOfScopeFormValues(
  values: OutOfScopeFormValues
): OutOfScopeFormValues {
  return {
    category: values.category,
    description: values.description.trim(),
    order: values.order,
  };
}

type OutOfScopeFormFieldsProps = {
  values: OutOfScopeFormValues;
  disabled?: boolean;
  descriptionId?: string;
  categoryId?: string;
  onChange: (patch: Partial<OutOfScopeFormValues>) => void;
};

export function OutOfScopeFormFields({
  values,
  disabled,
  descriptionId = "out-of-scope-description",
  categoryId = "out-of-scope-category",
  onChange,
}: OutOfScopeFormFieldsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={categoryId}>Danh mục</Label>
        <Select
          value={values.category}
          onValueChange={(category) =>
            onChange({ category: category as OutOfScopeCategory })
          }
          disabled={disabled}
        >
          <SelectTrigger id={categoryId}>
            <SelectValue>
              {OUT_OF_SCOPE_CATEGORY_LABELS[values.category]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {OUT_OF_SCOPE_CATEGORIES.map((cat) => (
              <SelectItem
                key={cat}
                value={cat}
                label={OUT_OF_SCOPE_CATEGORY_LABELS[cat]}
              >
                {OUT_OF_SCOPE_CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor={descriptionId}>Mô tả</Label>
        <Textarea
          id={descriptionId}
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          disabled={disabled}
          placeholder="Ví dụ: Tính năng đăng nhập bằng mạng xã hội nằm ngoài phạm vi dự án..."
          className="min-h-28"
        />
      </div>
    </>
  );
}
