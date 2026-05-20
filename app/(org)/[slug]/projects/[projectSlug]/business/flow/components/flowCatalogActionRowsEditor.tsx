"use client";

import type { ClipboardEvent } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
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

import {
  FLOW_ACTION_DESCRIPTION_MAX_CHARS,
  FLOW_MAX_CATALOG_ACTIONS,
} from "./flowFormLimits";

const ACTOR_NONE_VALUE = "__none__";
const RULE_NONE_VALUE = "__rule_none__";

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

function addRuleId(ruleIds: string[], ruleId: string): string[] {
  const id = ruleId.trim();
  if (!id || ruleIds.includes(id)) return ruleIds;
  return [...ruleIds, id];
}

function removeRuleId(ruleIds: string[], ruleId: string): string[] {
  return ruleIds.filter((id) => id !== ruleId);
}

function ruleLabel(rule: ProjectRule): string {
  return rule.ruleDef.trim() || rule.id;
}

export function flowCatalogActionRowsValidForSubmit(
  rows: FlowCatalogActionRowModel[]
): boolean {
  const filled = rows.filter(
    (r) => r.description.trim().length > 0 && r.actorId.trim().length > 0
  );
  return filled.length > 0;
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
}: FlowCatalogActionRowsEditorProps) {
  const canAddRow = canAppendFlowCatalogActionRow(rows, disabled) && allowAddRemove;

  function patchRow(index: number, patch: Partial<FlowCatalogActionRowModel>) {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
    onChange(next);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      onChange([
        {
          rowKey: rows[0]!.rowKey,
          persistId: rows[0]!.persistId,
          description: "",
          actorId: "",
          ruleIds: [],
        },
      ]);
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
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

      <ol className="list-none space-y-4">
        {rows.map((row, index) => (
          <li
            key={row.rowKey}
            className="rounded-xl border border-border/70 bg-muted/15 p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground">
                Action {index + 1}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {showOrderControls ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      disabled={disabled || index === 0}
                      aria-label="Đưa action lên"
                      onClick={() => onChange(moveRow(rows, index, -1))}
                    >
                      <ChevronUp className="size-4" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
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
                    variant="outline"
                    size="icon"
                    className="size-9 shrink-0 text-muted-foreground"
                    disabled={disabled || rows.length <= 1}
                    aria-label={`Xóa action ${index + 1}`}
                    onClick={() => removeRow(index)}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[minmax(11rem,14rem)_minmax(0,1fr)_minmax(11rem,16rem)] md:gap-3">
              <div className="grid min-w-0 gap-2">
                <Label
                  htmlFor={`${idPrefix}-actor-${row.rowKey}`}
                  className="text-sm font-semibold"
                >
                  Actor (business)
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
                <div className="flex items-baseline justify-between gap-2">
                  <Label
                    htmlFor={`${idPrefix}-desc-${row.rowKey}`}
                    className="text-sm font-semibold"
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
                  htmlFor={`${idPrefix}-rules-add-${row.rowKey}`}
                  className="text-sm font-semibold"
                >
                  Rules
                </Label>
                {rulesPending ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : rules.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Chưa có rule nào trong project.
                  </p>
                ) : (
                  <div className="grid min-w-0 gap-2">
                    <Select
                      value={RULE_NONE_VALUE}
                      onValueChange={(v) => {
                        if (v == null || v === RULE_NONE_VALUE) return;
                        const id = String(v).trim();
                        if (!id) return;
                        patchRow(index, {
                          ruleIds: addRuleId(row.ruleIds, id),
                        });
                      }}
                      disabled={
                        disabled ||
                        rules.filter((r) => !row.ruleIds.includes(r.id))
                          .length === 0
                      }
                    >
                      <SelectTrigger
                        id={`${idPrefix}-rules-add-${row.rowKey}`}
                        className="w-full"
                      >
                        <SelectValue>Thêm rule…</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={RULE_NONE_VALUE}>
                          Thêm rule…
                        </SelectItem>
                        {rules
                          .filter((r) => !row.ruleIds.includes(r.id))
                          .map((rule) => {
                            const label = ruleLabel(rule);
                            return (
                              <SelectItem
                                key={rule.id}
                                value={rule.id}
                                title={label}
                              >
                                {label}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                    {row.ruleIds.length > 0 ? (
                      <ul
                        className="grid w-full min-w-0 gap-2"
                        aria-label="Rules đã chọn"
                      >
                        {row.ruleIds.map((rid) => {
                          const rule = rules.find((r) => r.id === rid);
                          const text =
                            rule?.ruleDef?.trim() ||
                            (rule ? ruleLabel(rule) : rid);
                          return (
                            <li key={rid} className="min-w-0 max-w-full">
                              <span className="flex w-full min-w-0 max-w-full items-start gap-1.5 rounded-lg border border-border/70 bg-muted/40 px-2 py-1.5">
                                <span
                                  className="min-h-0 min-w-0 max-h-32 flex-1 overflow-y-auto overscroll-y-contain break-words pr-0.5 text-xs leading-snug text-foreground/90"
                                  title={text}
                                >
                                  {text}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="mt-0.5 size-6 shrink-0 text-muted-foreground hover:text-foreground"
                                  disabled={disabled}
                                  aria-label={`Bỏ rule ${rule ? ruleLabel(rule) : rid}`}
                                  onClick={() =>
                                    patchRow(index, {
                                      ruleIds: removeRuleId(row.ruleIds, rid),
                                    })
                                  }
                                >
                                  <X className="size-3.5" aria-hidden />
                                </Button>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Chưa chọn rule nào (tùy chọn).
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
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
    </div>
  );
}
