"use client";

import { useEffect, useState, type ClipboardEvent } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ListChecks,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectRule } from "@/lib/api/services/fetchRule";
import type { ProjectStakeholder } from "@/lib/api/services/fetchStakeHolder";
import { cn } from "@/lib/utils";

import { FlowActionRulesPickerDialog } from "./flowActionRulesPickerDialog";
import {
  FLOW_ACTION_DESCRIPTION_MAX_CHARS,
  FLOW_MAX_CATALOG_ACTIONS,
} from "../form/flowFormLimits";

const ACTOR_NONE_VALUE = "__none__";

export type FlowCatalogActionRowModel = {
  rowKey: string;
  /** Có khi chỉnh sửa (PATCH). */
  persistId?: string;
  description: string;
  actorId: string;
  ruleIds: string[];
};

export function newFlowCatalogActionRow(): FlowCatalogActionRowModel {
  return {
    rowKey:
      globalThis.crypto?.randomUUID?.() ??
      `row-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    description: "",
    actorId: "",
    ruleIds: [],
  };
}

export function canAppendFlowCatalogActionRow(
  rows: FlowCatalogActionRowModel[],
  disabled = false
): boolean {
  return rows.length < FLOW_MAX_CATALOG_ACTIONS && !disabled;
}

export function appendFlowCatalogActionRow(
  rows: FlowCatalogActionRowModel[]
): FlowCatalogActionRowModel[] {
  if (!canAppendFlowCatalogActionRow(rows)) return rows;
  return [...rows, newFlowCatalogActionRow()];
}

/** Bỏ prefix kiểu `1. `, `2) `, `3: ` ở đầu dòng paste. */
const PASTED_STEP_PREFIX =
  /^\s*\d+\s*(?:[.)\]:：\-–—]\s*|\s+)(.*)$/;

function trimActionDescription(text: string): string {
  return text.slice(0, FLOW_ACTION_DESCRIPTION_MAX_CHARS);
}

/** Mỗi dòng không rỗng → một mô tả action (có hoặc không có số đầu dòng). */
export function parsePastedActionLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";
      const withoutNumber = trimmed.replace(PASTED_STEP_PREFIX, "$1").trim();
      return withoutNumber || trimmed;
    })
    .filter((line) => line.length > 0)
    .map(trimActionDescription);
}

export function applyPastedLinesToRows(
  rows: FlowCatalogActionRowModel[],
  startIndex: number,
  lines: string[]
): { rows: FlowCatalogActionRowModel[]; droppedCount: number } {
  if (lines.length === 0) {
    return { rows, droppedCount: 0 };
  }

  const next = [...rows];
  let droppedCount = 0;

  for (let j = 0; j < lines.length; j++) {
    const targetIndex = startIndex + j;
    const description = lines[j]!;

    if (targetIndex < next.length) {
      next[targetIndex] = { ...next[targetIndex]!, description };
      continue;
    }

    if (next.length >= FLOW_MAX_CATALOG_ACTIONS) {
      droppedCount += lines.length - j;
      break;
    }

    next.push({ ...newFlowCatalogActionRow(), description });
  }

  return { rows: next.slice(0, FLOW_MAX_CATALOG_ACTIONS), droppedCount };
}

type FlowCatalogActionRowsEditorProps = {
  rows: FlowCatalogActionRowModel[];
  onChange: (rows: FlowCatalogActionRowModel[]) => void;
  stakeholders: ProjectStakeholder[];
  stakeholdersPending: boolean;
  rules: ProjectRule[];
  rulesPending: boolean;
  disabled?: boolean;
  idPrefix: string;
  allowAddRemove?: boolean;
  showOrderControls?: boolean;
  /** Ẩn nút «Thêm action» ở cuối danh sách (vd. đặt trên header dialog). */
  hideFooterAddButton?: boolean;
  /** Row vừa được thêm bằng nút add, dùng để chạy enter animation. */
  introRowKey?: string | null;
};

function moveRow(
  rows: FlowCatalogActionRowModel[],
  index: number,
  delta: -1 | 1
): FlowCatalogActionRowModel[] {
  const j = index + delta;
  if (j < 0 || j >= rows.length) return rows;
  const next = [...rows];
  const t = next[index];
  next[index] = next[j]!;
  next[j] = t!;
  return next;
}

/** Đủ business actor + mô tả — dùng highlight card và validate submit. */
export function isFlowCatalogActionRowComplete(
  row: FlowCatalogActionRowModel
): boolean {
  return row.description.trim().length > 0 && row.actorId.trim().length > 0;
}

export function flowCatalogActionRowsValidForSubmit(
  rows: FlowCatalogActionRowModel[]
): boolean {
  return rows.some(isFlowCatalogActionRowComplete);
}

export function FlowCatalogActionRowsEditor({
  rows,
  onChange,
  stakeholders,
  stakeholdersPending,
  rules,
  rulesPending,
  disabled = false,
  idPrefix,
  allowAddRemove = false,
  showOrderControls = false,
  hideFooterAddButton = false,
  introRowKey = null,
}: FlowCatalogActionRowsEditorProps) {
  const [rulesPickerRowKey, setRulesPickerRowKey] = useState<string | null>(null);
  const [deletingRowKey, setDeletingRowKey] = useState<string | null>(null);
  const canAddRow = canAppendFlowCatalogActionRow(rows, disabled) && allowAddRemove;

  const rulesPickerRowIndex =
    rulesPickerRowKey == null
      ? -1
      : rows.findIndex((r) => r.rowKey === rulesPickerRowKey);
  const rulesPickerRow =
    rulesPickerRowIndex >= 0 ? rows[rulesPickerRowIndex] : undefined;

  function openRulesPicker(index: number) {
    setRulesPickerRowKey(rows[index]!.rowKey);
  }

  function patchRow(index: number, patch: Partial<FlowCatalogActionRowModel>) {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange(next);
  }

  function removeRow(index: number) {
    if (deletingRowKey != null) return;
    const targetRow = rows[index];
    if (!targetRow) return;

    if (rows.length <= 1) {
      setDeletingRowKey(targetRow.rowKey);
      window.setTimeout(() => {
        onChange([
          {
            rowKey: targetRow.rowKey,
            persistId: targetRow.persistId,
            description: "",
            actorId: "",
            ruleIds: [],
          },
        ]);
        setDeletingRowKey(null);
      }, 220);
      return;
    }

    setDeletingRowKey(targetRow.rowKey);
    window.setTimeout(() => {
      onChange(rows.filter((r) => r.rowKey !== targetRow.rowKey));
      setDeletingRowKey(null);
    }, 220);
  }

  function addRow() {
    if (!canAddRow) return;
    onChange(appendFlowCatalogActionRow(rows));
  }

  function handleDescriptionPaste(
    index: number,
    e: ClipboardEvent<HTMLInputElement>
  ) {
    if (disabled) return;

    const text = e.clipboardData.getData("text/plain");
    if (!text.trim()) return;

    const lines = parsePastedActionLines(text);
    if (lines.length === 0) return;

    e.preventDefault();

    if (lines.length === 1) {
      patchRow(index, { description: lines[0]! });
      return;
    }

    const { rows: nextRows, droppedCount } = applyPastedLinesToRows(
      rows,
      index,
      lines
    );
    onChange(nextRows);

    if (droppedCount > 0) {
      toast.message(
        `Chỉ thêm được tối đa ${FLOW_MAX_CATALOG_ACTIONS} action`,
        {
          description: `${droppedCount} dòng bị bỏ qua.`,
        }
      );
    } else {
      toast.success(`Đã tách ${lines.length} action từ danh sách paste`);
    }
  }

  const loading = stakeholdersPending || rulesPending;

  useEffect(() => {
    if (introRowKey == null) return;
    const input = document.getElementById(`${idPrefix}-desc-${introRowKey}`);
    window.setTimeout(() => input?.focus(), 260);
  }, [idPrefix, introRowKey]);

  return (
    <div className="grid w-full min-w-0 gap-5 py-2">
      {loading ? (
        <div className="grid gap-2">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : null}

      {!loading && stakeholders.length === 0 ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
          Chưa có stakeholder nào được đánh dấu business actor. Thêm hoặc bật
          &quot;Business actor&quot; trong Stakeholders trước khi gán action.
        </p>
      ) : null}

      <ol className="relative overflow-hidden rounded-xl border border-border/70 bg-card/35 before:pointer-events-none before:absolute before:bottom-4 before:left-7 before:top-4 before:z-10 before:w-px before:bg-border/60 sm:before:left-8">
        {rows.map((row, index) => {
          const rowComplete = isFlowCatalogActionRowComplete(row);
          const rowIntro = introRowKey === row.rowKey;
          const rowDeleting = deletingRowKey === row.rowKey;
          return (
          <li
            key={row.rowKey}
            className={cn(
              "flow-action-editor-row relative border-b border-border/60 p-3 transition-colors duration-150 last:border-b-0 sm:p-4",
              rowComplete
                ? "bg-emerald-500/[0.035]"
                : "bg-transparent",
              rowDeleting && "flow-action-editor-row-exit"
            )}
            data-complete={rowComplete ? "true" : undefined}
            aria-hidden={rowDeleting ? "true" : undefined}
          >
            <div className={cn(rowIntro && "flow-action-editor-row-enter")}>
            <div className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] gap-3">
              <div className="relative flex justify-center">
                <span
                  className={cn(
                    "relative z-20 flex size-8 items-center justify-center rounded-lg border text-xs font-bold tabular-nums shadow-[0_0_0_4px_hsl(var(--card))]",
                    rowComplete
                      ? "border-emerald-500/25 bg-card text-emerald-300"
                      : "border-primary/20 bg-card text-primary"
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                Action
                {rowComplete ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                    <CheckCircle2 className="size-3" aria-hidden />
                    Đủ thông tin
                  </span>
                ) : null}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {showOrderControls ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground"
                      disabled={disabled || index === 0}
                      aria-label="Đưa action lên"
                      onClick={() => onChange(moveRow(rows, index, -1))}
                    >
                      <ChevronUp className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground"
                      disabled={disabled || index === rows.length - 1}
                      aria-label="Đưa action xuống"
                      onClick={() => onChange(moveRow(rows, index, 1))}
                    >
                      <ChevronDown className="size-4" aria-hidden />
                    </Button>
                  </>
                ) : null}
                {allowAddRemove ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    disabled={disabled || deletingRowKey != null}
                    aria-label={`Xóa action ${index + 1}`}
                    onClick={() => removeRow(index)}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,15rem)_minmax(12rem,16rem)]">
              <div className="grid min-w-0 gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <Label
                    htmlFor={`${idPrefix}-desc-${row.rowKey}`}
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Mô tả action
                  </Label>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {row.description.length} / {FLOW_ACTION_DESCRIPTION_MAX_CHARS}
                  </span>
                </div>
                <Input
                  id={`${idPrefix}-desc-${row.rowKey}`}
                  value={row.description}
                  onChange={(e) =>
                    patchRow(index, {
                      description: e.target.value.slice(
                        0,
                        FLOW_ACTION_DESCRIPTION_MAX_CHARS
                      ),
                    })
                  }
                  onPaste={(e) => handleDescriptionPaste(index, e)}
                  disabled={disabled}
                  placeholder="Mô tả bước… (paste nhiều dòng để tách action)"
                  className="h-10 min-w-0 border-border/80 bg-background/70"
                />
              </div>

              <div className="grid min-w-0 gap-2">
                <Label
                  htmlFor={`${idPrefix}-actor-${row.rowKey}`}
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Business Actor
                </Label>
                <Select
                  value={row.actorId.trim() ? row.actorId : ACTOR_NONE_VALUE}
                  onValueChange={(v) =>
                    patchRow(index, {
                      actorId:
                        v == null || v === ACTOR_NONE_VALUE ? "" : String(v),
                    })
                  }
                  disabled={disabled || stakeholdersPending}
                >
                  <SelectTrigger
                    id={`${idPrefix}-actor-${row.rowKey}`}
                    className="w-full"
                  >
                    <SelectValue>
                      {row.actorId.trim()
                        ? (stakeholders.find((s) => s.id === row.actorId)?.name ??
                          "Đã chọn")
                        : "Chọn actor…"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ACTOR_NONE_VALUE}>Chọn actor…</SelectItem>
                    {stakeholders.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name.trim() || s.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid min-w-0 gap-2">
                <Label
                  htmlFor={`${idPrefix}-rules-${row.rowKey}`}
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Rules
                </Label>
                {rulesPending ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    id={`${idPrefix}-rules-${row.rowKey}`}
                    className="h-10 w-full justify-start gap-2 px-3 font-normal"
                    disabled={disabled || rules.length === 0}
                    onClick={() => openRulesPicker(index)}
                  >
                    <ListChecks
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 text-left text-sm">
                      {rules.length === 0
                        ? "Chưa có rule trong project"
                        : row.ruleIds.length === 0
                          ? "Chọn rules…"
                          : `${row.ruleIds.length} rule đã chọn`}
                    </span>
                  </Button>
                )}
              </div>
            </div>
              </div>
            </div>
            </div>
          </li>
          );
        })}
      </ol>

      {allowAddRemove && !hideFooterAddButton ? (
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full gap-1.5 border-dashed"
          disabled={!canAddRow}
          onClick={addRow}
        >
          <Plus className="size-4" aria-hidden />
          Thêm action
        </Button>
      ) : null}

      <FlowActionRulesPickerDialog
        open={rulesPickerRowKey != null && rulesPickerRow != null}
        sessionKey={rulesPickerRowKey ?? "closed"}
        onOpenChange={(open) => {
          if (!open) setRulesPickerRowKey(null);
        }}
        rules={rules}
        value={rulesPickerRow?.ruleIds ?? []}
        onConfirm={(ruleIds) => {
          if (rulesPickerRowIndex >= 0) {
            patchRow(rulesPickerRowIndex, { ruleIds });
          }
          setRulesPickerRowKey(null);
        }}
        actionLabel={
          rulesPickerRowIndex >= 0
            ? `Action ${rulesPickerRowIndex + 1}`
            : undefined
        }
      />
    </div>
  );
}
