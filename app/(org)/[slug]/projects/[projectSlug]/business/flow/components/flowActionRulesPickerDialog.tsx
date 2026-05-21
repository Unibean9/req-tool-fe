"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ProjectRule, ProjectRuleType } from "@/lib/api/services/fetchRule";
import { cn } from "@/lib/utils";

const RULE_TYPE_LABELS: Record<ProjectRuleType, string> = {
  constraint: "Constraint",
  calculation: "Calculation",
  validation: "Validation",
  process: "Process",
  policy: "Policy",
  regulation: "Regulation",
};

/**
 * Dialog rộng + cao — căn giữa viewport bằng inset + margin (không translate),
 * tránh lệch khi animation scale ghi đè transform căn giữa mặc định.
 */
const RULES_PICKER_DIALOG_SIZE_CLASS = cn(
  "!inset-0 !top-0 !right-0 !bottom-0 !left-0 m-auto",
  "!translate-x-0 !translate-y-0",
  "!h-[min(85dvh,52rem)] !w-[min(100vw-2rem,48rem)] !max-h-[min(85dvh,52rem)] !max-w-[min(100vw-2rem,48rem)]",
  "origin-center sm:!max-w-3xl"
);

function foldForSearch(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function ruleDisplayText(rule: ProjectRule): string {
  return rule.ruleDef.trim() || rule.id;
}

function matchesRuleSearch(rule: ProjectRule, query: string): boolean {
  const q = foldForSearch(query);
  if (!q) return true;
  const haystack = [
    rule.ruleDef,
    rule.type,
    RULE_TYPE_LABELS[rule.type],
    rule.source,
  ]
    .map((part) => foldForSearch(part))
    .join(" ");
  return haystack.includes(q);
}

export type FlowActionRulesPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rules: ProjectRule[];
  /** Rule ids đang chọn trên action (sync khi mở). */
  value: string[];
  onConfirm: (ruleIds: string[]) => void;
  /** Đổi mỗi lần mở picker cho action khác — reset draft (tránh setState trong effect). */
  sessionKey: string;
  /** VD. «Action 2» */
  actionLabel?: string;
};

type FlowActionRulesPickerBodyProps = {
  rules: ProjectRule[];
  initialRuleIds: string[];
  onConfirm: (ruleIds: string[]) => void;
  onCancel: () => void;
  actionLabel?: string;
};

function FlowActionRulesPickerBody({
  rules,
  initialRuleIds,
  onConfirm,
  onCancel,
  actionLabel,
}: FlowActionRulesPickerBodyProps) {
  const [draftIds, setDraftIds] = useState(() => [...initialRuleIds]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim();
    if (!q) return rules;
    return rules.filter((r) => matchesRuleSearch(r, q));
  }, [rules, search]);

  const selectedSet = useMemo(() => new Set(draftIds), [draftIds]);

  function toggleRule(ruleId: string) {
    setDraftIds((prev) =>
      prev.includes(ruleId)
        ? prev.filter((id) => id !== ruleId)
        : [...prev, ruleId]
    );
  }

  function handleConfirm() {
    onConfirm(draftIds);
  }

  const count = draftIds.length;

  return (
    <>
      <DialogHeader className="shrink-0 border-b border-border/60 px-5 py-4 pr-12">
        <DialogTitle className="text-lg">Chọn rule(s)</DialogTitle>
        <DialogDescription>
          {actionLabel ? (
            <>
              Gán rule(s) cho{" "}
              <span className="font-medium text-foreground">{actionLabel}</span>.
              Có thể chọn nhiều rule(s).
            </>
          ) : (
            "Chọn một hoặc nhiều rule cho action này."
          )}
        </DialogDescription>
      </DialogHeader>

      <div className="shrink-0 px-5 pt-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm rule theo mô tả, loại, nguồn…"
            className="h-10 border-border/80 bg-background/70 pl-9"
            aria-label="Tìm rule"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4">
        {rules.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Chưa có rule nào trong project.
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Không có rule khớp &quot;{search.trim()}&quot;.
          </p>
        ) : (
          <ul className="grid list-none gap-2">
            {filtered.map((rule) => {
              const checked = selectedSet.has(rule.id);
              const text = ruleDisplayText(rule);
              const checkboxId = `flow-action-rule-${rule.id}`;
              return (
                <li key={rule.id}>
                  <label
                    htmlFor={checkboxId}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                      checked
                        ? "border-primary/45 bg-primary/10"
                        : "border-border/70 bg-muted/15 hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      onCheckedChange={() => toggleRule(rule.id)}
                      className="mt-0.5 size-4.5 shrink-0"
                      aria-label={`Chọn rule ${text}`}
                    />
                    <span className="min-w-0 flex-1 space-y-1.5">
                      <span className="block text-sm leading-relaxed text-foreground">
                        {text}
                      </span>
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-medium">
                          {RULE_TYPE_LABELS[rule.type]}
                        </Badge>
                        {rule.isDynamic ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Dynamic
                          </Badge>
                        ) : null}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div
        className="shrink-0 border-t border-border/80 bg-muted/20 px-5 py-4 backdrop-blur-sm"
        role="group"
        aria-label="Thao tác chọn rule"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm shadow-sm",
                count > 0
                  ? "border-primary/40 bg-primary/12 text-foreground"
                  : "border-border/80 bg-background/50 text-muted-foreground"
              )}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Đã chọn
              </span>
              <span className="font-semibold tabular-nums">{count}</span>
              <span className="text-muted-foreground">rule(s)</span>
            </div>
            {count > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setDraftIds([])}
              >
                Bỏ chọn hết
              </Button>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2.5">
            <Button type="button" variant="outline" className="min-w-20" onClick={onCancel}>
              Hủy
            </Button>
            <Button type="button" className="min-w-24" onClick={handleConfirm}>
              Áp dụng
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/** Dialog chọn nhiều rule — z-index trên editFlowActionFormDialog. */
export function FlowActionRulesPickerDialog({
  open,
  onOpenChange,
  rules,
  value,
  onConfirm,
  sessionKey,
  actionLabel,
}: FlowActionRulesPickerDialogProps) {
  function handleConfirm(ruleIds: string[]) {
    onConfirm(ruleIds);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("z-230 gap-0", RULES_PICKER_DIALOG_SIZE_CLASS)}
        overlayClassName="z-220"
        contentClassName="flex min-h-0 flex-col gap-0 p-0"
        showCloseButton
      >
        {open ? (
          <FlowActionRulesPickerBody
            key={sessionKey}
            rules={rules}
            initialRuleIds={value}
            onConfirm={handleConfirm}
            onCancel={() => onOpenChange(false)}
            actionLabel={actionLabel}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
