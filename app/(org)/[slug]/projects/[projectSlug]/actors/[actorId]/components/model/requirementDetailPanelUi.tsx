"use client";

import type { ComponentProps, ReactNode } from "react";

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
import { cn } from "@/lib/utils";

import { clampText } from "./requirementDetailFormLimits";
import {
  workItemPriorityLabel,
  workItemStatusLabel,
} from "./requirementWorkItemLabels";

/** Tiêu đề nhóm field trong sidebar — phẳng, không bọc card. */
export function DetailPanelSection({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {hint ? (
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function DetailFieldRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

/** Giá trị cố định — không chỉnh sửa trên panel. */
export function DetailReadOnlyField({
  id,
  label,
  value,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  hint?: string;
}) {
  const display = value.trim() || "—";
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <div
        id={id}
        className="rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-sm text-foreground"
      >
        {display}
      </div>
      {hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function DetailFieldLabel({
  htmlFor,
  label,
  currentLength,
  maxLength,
  className,
}: {
  htmlFor: string;
  label: string;
  currentLength?: number;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {maxLength != null && currentLength != null ? (
        <span
          className="shrink-0 text-[10px] tabular-nums text-muted-foreground"
          aria-live="polite"
        >
          {currentLength}/{maxLength}
        </span>
      ) : null}
    </div>
  );
}

type DetailTextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  hint?: string;
} & Omit<ComponentProps<typeof Input>, "id" | "value" | "onChange">;

export function DetailTextField({
  id,
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  hint,
  className,
  ...inputProps
}: DetailTextFieldProps) {
  return (
    <div className="space-y-2">
      <DetailFieldLabel
        htmlFor={id}
        label={label}
        currentLength={value.length}
        maxLength={maxLength}
      />
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(clampText(e.target.value, maxLength))}
        className={cn("text-sm", className)}
        {...inputProps}
      />
      {hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type DetailTextAreaFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  hint?: string;
  rows?: number;
} & Omit<ComponentProps<typeof Textarea>, "id" | "value" | "onChange">;

export function DetailTextAreaField({
  id,
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  hint,
  rows = 3,
  className,
  ...textareaProps
}: DetailTextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <DetailFieldLabel
        htmlFor={id}
        label={label}
        currentLength={value.length}
        maxLength={maxLength}
      />
      <Textarea
        id={id}
        value={value}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(clampText(e.target.value, maxLength))}
        className={cn("resize-none text-sm", className)}
        {...textareaProps}
      />
      {hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function DetailStatusSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="w-full text-sm">
          <SelectValue placeholder="Chọn trạng thái" />
        </SelectTrigger>
        <SelectContent>
          {options.map((s) => (
            <SelectItem key={s} value={s}>
              {workItemStatusLabel(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DetailPrioritySelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="w-full text-sm">
          <SelectValue placeholder="Chọn độ ưu tiên" />
        </SelectTrigger>
        <SelectContent>
          {options.map((p) => (
            <SelectItem key={p} value={p}>
              {workItemPriorityLabel(p)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
