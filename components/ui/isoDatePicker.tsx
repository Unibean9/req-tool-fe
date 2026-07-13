"use client";

import { useMemo, useState } from "react";
import { startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatProjectIsoDate,
  parseProjectIsoDate,
  startOfTodayLocal,
  toProjectIsoDate,
} from "@/lib/project/projectDisplay";
import { cn } from "@/lib/utils";

type IsoDatePickerProps = {
  id?: string;
  value: string;
  onChange: (iso: string) => void;
  /** Ngày sớm nhất có thể chọn (mặc định: hôm nay). */
  minDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  "aria-invalid"?: boolean;
  className?: string;
};

function isBeforeMinDay(date: Date, min: Date): boolean {
  return date.getTime() < min.getTime();
}

export function IsoDatePicker({
  id,
  value,
  onChange,
  minDate,
  disabled,
  placeholder = "Select date",
  "aria-invalid": ariaInvalid,
  className,
}: IsoDatePickerProps) {
  const [open, setOpen] = useState(false);
  const min = useMemo(
    () => (minDate ? startOfDay(minDate) : startOfTodayLocal()),
    [minDate]
  );
  const selected = useMemo(() => parseProjectIsoDate(value), [value]);

  const label = value.trim()
    ? formatProjectIsoDate(value)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            className={cn(
              "h-10 w-full min-w-0 justify-start gap-2 border-2 border-border/90 px-3 font-normal dark:border-zinc-600",
              !value.trim() && "text-muted-foreground",
              ariaInvalid && "border-destructive",
              className
            )}
          />
        }
      >
        <CalendarIcon className="size-4 shrink-0 opacity-70" aria-hidden />
        <span className="truncate">{label}</span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected ?? min}
          onSelect={(day) => {
            if (!day) return;
            onChange(toProjectIsoDate(day));
            setOpen(false);
          }}
          disabled={(date) => isBeforeMinDay(date, min)}
        />
      </PopoverContent>
    </Popover>
  );
}
