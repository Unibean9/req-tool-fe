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
import { parseWorkItemLabels } from "./requirementWorkItemCard";
import {
  workItemPriorityLabel,
  workItemPriorityPillClass,
  workItemStatusLabel,
  workItemStatusPillClass,
  WorkItemColoredPill,
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

export function DetailLabelTagsField({
  id,
  label,
  value,
  onChange,
  maxTagLength = 48,
  maxTags = 12,
  placeholder = "Gõ label rồi Enter…",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxTagLength?: number;
  maxTags?: number;
  placeholder?: string;
}) {
  const tags = parseWorkItemLabels(value);

  function commitTags(next: string[]) {
    onChange(next.join(", "));
  }

  function removeTag(index: number) {
    commitTags(tags.filter((_, i) => i !== index));
  }

  function tryAddTag(raw: string) {
    const parts = raw
      .split(/[,;]/)
      .map((s) => s.trim().slice(0, maxTagLength))
      .filter(Boolean);
    if (parts.length === 0) return;
    const merged = [...tags];
    for (const part of parts) {
      if (merged.length >= maxTags) break;
      if (!merged.some((t) => t.toLowerCase() === part.toLowerCase())) {
        merged.push(part);
      }
    }
    commitTags(merged);
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border border-border/80 bg-muted/30 px-2 py-1.5">
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-border/80 bg-background px-2 py-0.5 text-xs text-foreground"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              className="shrink-0 rounded-sm text-muted-foreground hover:text-foreground"
              aria-label={`Xóa label ${tag}`}
              onClick={() => removeTag(index)}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length < maxTags ? (
          <input
            id={id}
            type="text"
            className="min-w-[7rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={tags.length === 0 ? placeholder : "Thêm…"}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                tryAddTag((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
              if (
                e.key === "Backspace" &&
                (e.target as HTMLInputElement).value === "" &&
                tags.length > 0
              ) {
                removeTag(tags.length - 1);
              }
            }}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v) {
                tryAddTag(v);
                e.target.value = "";
              }
            }}
          />
        ) : null}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Enter hoặc dấu phẩy để thêm. Tối đa {maxTags} label.
      </p>
    </div>
  );
}

export function DetailStatusSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  colored = false,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  colored?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Select
        value={
          (options as readonly string[]).includes(value) ? value : undefined
        }
        onValueChange={(v) => {
          if (v != null) onChange(v as T);
        }}
      >
        <SelectTrigger id={id} className="w-full text-sm">
          <SelectValue placeholder="Chọn trạng thái">
            {colored ? (
              <WorkItemColoredPill
                text={workItemStatusLabel(value)}
                colorClass={workItemStatusPillClass(value)}
              />
            ) : (
              workItemStatusLabel(value)
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((s) => (
            <SelectItem
              key={s}
              value={s}
              label={workItemStatusLabel(s)}
            >
              {colored ? (
                <WorkItemColoredPill
                  text={workItemStatusLabel(s)}
                  colorClass={workItemStatusPillClass(s)}
                />
              ) : (
                workItemStatusLabel(s)
              )}
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
  colored = false,
}: {
  id: string;
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  colored?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="w-full text-sm">
          <SelectValue placeholder="Chọn độ ưu tiên">
            {colored ? (
              <WorkItemColoredPill
                text={workItemPriorityLabel(value)}
                colorClass={workItemPriorityPillClass(value)}
              />
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((p) => (
            <SelectItem
              key={p}
              value={p}
              label={workItemPriorityLabel(p)}
            >
              {colored ? (
                <WorkItemColoredPill
                  text={workItemPriorityLabel(p)}
                  colorClass={workItemPriorityPillClass(p)}
                />
              ) : (
                workItemPriorityLabel(p)
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
