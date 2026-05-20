"use client";

import { UserRoundCheck } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type StakeHolderBusinessActorFieldProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

/** Bật/tắt business actor — card chọn một lần, đồng bộ với list & flow actions. */
export function StakeHolderBusinessActorField({
  id,
  checked,
  onChange,
  disabled = false,
}: StakeHolderBusinessActorFieldProps) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-foreground">Vai trò trong mô hình</p>
      <label
        htmlFor={id}
        className={cn(
          "group flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-[border-color,background-color,box-shadow] duration-200",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring/45",
          disabled && "cursor-not-allowed opacity-60",
          checked
            ? "border-primary/50 bg-primary/10 shadow-sm shadow-primary/10"
            : "border-border/80 bg-muted/20 hover:border-primary/25 hover:bg-muted/35"
        )}
      >
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200",
            checked
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-border/70 bg-background/50 text-muted-foreground group-hover:border-primary/20 group-hover:text-foreground/80"
          )}
          aria-hidden
        >
          <UserRoundCheck className="size-5" strokeWidth={2} />
        </span>

        <span className="min-w-0 flex-1 space-y-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Business actor
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                checked
                  ? "bg-primary/25 text-primary"
                  : "bg-muted/80 text-muted-foreground"
              )}
            >
              {checked ? "Là business actor" : "Không phải actor"}
            </span>
          </span>
          <span className="block text-xs leading-relaxed text-muted-foreground">
            Đánh dấu stakeholder là{" "}
            <span className="font-medium text-foreground/90">
              tác nhân nghiệp vụ
            </span>{" "}
            trong UML / swimlane — hiện khi gán actor cho flow actions.
          </span>
        </span>

        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(value) => onChange(value === true)}
          disabled={disabled}
          className={cn(
            "mt-0.5 size-6 shrink-0 rounded-[5px] border-2 shadow-sm",
            "border-foreground/50 bg-card ring-1 ring-border/70",
            "dark:border-foreground/55 dark:bg-background dark:ring-white/10",
            "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
            "data-checked:shadow-md data-checked:shadow-primary/35",
            "focus-visible:ring-2 focus-visible:ring-primary/50",
            "[&_[data-slot=checkbox-indicator]_svg]:size-4",
            "[&_[data-slot=checkbox-indicator]_svg]:stroke-[3]"
          )}
          aria-describedby={`${id}-hint`}
        />
      </label>
      <p id={`${id}-hint`} className="sr-only">
        Bật nếu stakeholder tham gia luồng nghiệp vụ dưới dạng actor trên sơ đồ.
      </p>
    </div>
  );
}
