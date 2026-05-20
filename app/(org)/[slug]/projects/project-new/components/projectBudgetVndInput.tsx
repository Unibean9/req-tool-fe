"use client";

import {
  useCallback,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Coins } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  formatBudgetAmountForInput,
  parseBudgetInputDigits,
} from "@/lib/project/projectDisplay";

import { ProjectNewFieldError } from "./projectNewFieldError";

type ProjectBudgetVndInputProps = {
  id?: string;
  label?: string;
  required?: boolean;
  value: number;
  onChange: (amount: number) => void;
  disabled?: boolean;
  error?: string;
  showError?: boolean;
  className?: string;
};

export function ProjectBudgetVndInput({
  id = "pn-budget",
  label = "Ngân sách",
  required = false,
  value,
  onChange,
  disabled,
  error,
  showError = false,
  className,
}: ProjectBudgetVndInputProps) {
  const [focused, setFocused] = useState(false);

  const displayValue =
    focused && value === 0 ? "" : formatBudgetAmountForInput(value);

  const handleFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
  }, []);

  const handleChange = useCallback(
    (raw: string) => {
      onChange(parseBudgetInputDigits(raw));
    },
    [onChange]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const text = e.clipboardData.getData("text");
      handleChange(text);
    },
    [handleChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const allowed = [
        "Backspace",
        "Delete",
        "Tab",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ];
      if (allowed.includes(e.key)) return;
      if (e.ctrlKey || e.metaKey) return;
      if (/^\d$/.test(e.key)) return;
      e.preventDefault();
    },
    []
  );

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={id} className="text-sm font-semibold">
        {label}
        {required ? (
          <>
            {" "}
            <span className="text-destructive">*</span>
          </>
        ) : null}
      </Label>
      <div className="relative w-full">
        <Coins
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={Boolean(showError && error)}
          disabled={disabled}
          value={displayValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Nhập số tiền"
          className={cn(
            "h-10 w-full min-w-0 border-2 border-border/90 pr-14 pl-10 text-left tabular-nums dark:border-zinc-600",
            showError && error && "border-destructive"
          )}
        />
        <span
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm font-medium text-muted-foreground"
          aria-hidden
        >
          VNĐ
        </span>
      </div>
      <ProjectNewFieldError message={showError ? error : undefined} />
    </div>
  );
}
