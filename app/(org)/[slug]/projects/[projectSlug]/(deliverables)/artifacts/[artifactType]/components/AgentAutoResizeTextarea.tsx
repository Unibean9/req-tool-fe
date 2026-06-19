"use client";

import {
  useLayoutEffect,
  useRef,
  type ComponentProps,
  type KeyboardEvent,
} from "react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AgentAutoResizeTextareaProps = Omit<
  ComponentProps<"textarea">,
  "onChange" | "value"
> & {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit?: () => void;
  minHeight?: number;
  maxHeight?: number;
};

export function AgentAutoResizeTextarea({
  value,
  onValueChange,
  onSubmit,
  onKeyDown,
  minHeight = 56,
  maxHeight = 240,
  className,
  style,
  ...props
}: AgentAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    const nextHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [maxHeight, minHeight, value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      !onSubmit ||
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    onSubmit();
  };

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      onKeyDown={handleKeyDown}
      rows={1}
      className={cn(
        "min-h-0 max-h-none resize-none overflow-y-hidden md:max-h-none",
        className
      )}
      style={{
        ...style,
        minHeight,
        maxHeight,
      }}
      {...props}
    />
  );
}
