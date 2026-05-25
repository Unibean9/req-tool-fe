"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STAKEHOLDER_ACTOR_TYPES,
  type StakeholderActorType,
} from "@/lib/api/services/fetchStakeHolder";

export const ACTOR_TYPE_LABELS: Record<StakeholderActorType, string> = {
  none: "None",
  business_actor: "Business actor",
  other_actor: "Other actor",
};

type StakeHolderActorTypeFieldProps = {
  id: string;
  value: StakeholderActorType;
  onChange: (value: StakeholderActorType) => void;
  disabled?: boolean;
};

export function StakeHolderActorTypeField({
  id,
  value,
  onChange,
  disabled = false,
}: StakeHolderActorTypeFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">
        Vai trò mô hình
      </Label>
      <Select
        value={value}
        onValueChange={(v) => {
          if (v != null && (STAKEHOLDER_ACTOR_TYPES as readonly string[]).includes(v)) {
            onChange(v as StakeholderActorType);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="h-10 w-full text-sm">
          <SelectValue placeholder="Select model role">
            {ACTOR_TYPE_LABELS[value]}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {STAKEHOLDER_ACTOR_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {ACTOR_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
