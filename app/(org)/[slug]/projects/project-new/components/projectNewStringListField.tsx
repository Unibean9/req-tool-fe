"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { ProjectNewFieldError } from "./projectNewFieldError";
import {
  resolveProjectNewListItemError,
  resolveProjectNewListRootError,
} from "./projectNewFieldValidation";
import {
  PROJECT_STRING_LIST_DEFAULT_VISIBLE_ROWS,
  projectStringListViewportClassForRows,
  projectStringListViewportHeightForRows,
} from "./projectFormLimits";
import type { ProjectNewFormErrors } from "./projectNewFormSchema";

export function ProjectNewStringListField({
  id,
  fieldKey,
  label,
  hint,
  placeholder = "Enter content…",
  items,
  onChange,
  disabled,
  addLabel = "Add item",
  scrollable = false,
  visibleRows = PROJECT_STRING_LIST_DEFAULT_VISIBLE_ROWS,
  listViewportClassName,
  listViewportHeight,
  addButtonInHeader = false,
  showSubmitErrors = false,
  errors,
  required = false,
  className,
}: {
  id: string;
  fieldKey: string;
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
  addLabel?: string;
  scrollable?: boolean;
  /** Number of rows fully visible in the container (default 7; item 8+ scrolls). */
  visibleRows?: number;
  listViewportClassName?: string;
  /** Override the scroll area height (inline style). */
  listViewportHeight?: string;
  addButtonInHeader?: boolean;
  showSubmitErrors?: boolean;
  errors?: ProjectNewFormErrors;
  className?: string;
}) {
  const addItem = () => onChange([...items, ""]);

  const updateAt = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const listError = resolveProjectNewListRootError(
    errors?.[fieldKey],
    showSubmitErrors
  );

  const resolvedViewportClass =
    listViewportClassName ??
    (scrollable
      ? projectStringListViewportClassForRows(visibleRows)
      : undefined);
  const resolvedViewportHeight =
    listViewportHeight ??
    (scrollable
      ? projectStringListViewportHeightForRows(visibleRows)
      : undefined);

  const addButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto shrink-0 px-0 text-primary hover:bg-transparent hover:text-primary/90"
      disabled={disabled}
      onClick={addItem}
    >
      <Plus className="size-4" aria-hidden />
      {addLabel}
    </Button>
  );

  const emptyList = (
    <p className="w-full px-3 py-4 text-center text-xs font-semibold text-muted-foreground">
      No items yet. Click &ldquo;{addLabel}&rdquo; to add one.
    </p>
  );

  const listItems = (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const itemError = resolveProjectNewListItemError(
          item,
          errors?.[`${fieldKey}.${index}`],
          showSubmitErrors
        );
        return (
          <li key={`${id}-${index}`} className="flex flex-col gap-1">
            <div className="flex gap-2">
              <Input
                id={index === 0 ? `${id}-0` : undefined}
                aria-label={`${label} ${index + 1}`}
                aria-invalid={Boolean(itemError)}
                placeholder={placeholder}
                value={item}
                onChange={(e) => updateAt(index, e.target.value)}
                disabled={disabled}
                className={cn(
                  "h-10 min-w-0 flex-1 border-2 border-border/90 dark:border-zinc-600",
                  itemError && "border-destructive"
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={disabled}
                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                onClick={() => removeAt(index)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
            <ProjectNewFieldError message={itemError} />
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className={cn(
        scrollable ? "flex min-h-0 flex-col gap-2" : "grid gap-2",
        className
      )}
    >
      <div
        className={cn(
          "shrink-0",
          addButtonInHeader &&
            "flex items-center justify-between gap-3"
        )}
      >
        <div className="min-w-0">
          <Label htmlFor={`${id}-0`} className="text-sm font-semibold">
            {label}
            {required ? (
              <>
                {" "}
                <span className="text-destructive">*</span>
              </>
            ) : null}
          </Label>
          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {addButtonInHeader ? addButton : null}
      </div>
      <ProjectNewFieldError message={listError} />
      {scrollable ? (
        <div
          className={cn(
            "min-h-0 shrink-0 overflow-y-auto overscroll-contain pb-px pr-1",
            resolvedViewportClass
          )}
          style={
            resolvedViewportHeight
              ? {
                  height: resolvedViewportHeight,
                  minHeight: resolvedViewportHeight,
                }
              : undefined
          }
        >
          {items.length === 0 ? (
            <div className="flex h-full min-h-full items-center justify-center">
              {emptyList}
            </div>
          ) : (
            listItems
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {items.length === 0 ? emptyList : listItems}
        </div>
      )}
      {!addButtonInHeader ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto w-full justify-start px-0 text-primary hover:bg-transparent hover:text-primary/90 sm:w-auto",
            scrollable && "shrink-0"
          )}
          disabled={disabled}
          onClick={addItem}
        >
          <Plus className="size-4" aria-hidden />
          {addLabel}
        </Button>
      ) : null}
    </div>
  );
}