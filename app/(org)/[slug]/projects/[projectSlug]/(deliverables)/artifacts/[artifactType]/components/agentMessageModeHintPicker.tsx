"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  AGENT_MESSAGE_MODE_HINTS,
  AGENT_MESSAGE_MODE_HINT_LABELS,
  type AgentMessageModeHint,
} from "./agentMessageModeHint";

export function AgentMessageModeHintPicker({
  value,
  onChange,
  disabled = false,
  className,
}: {
  value: AgentMessageModeHint | null;
  onChange: (value: AgentMessageModeHint | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Response mode for this session"
      className={cn("flex flex-wrap gap-1", className)}
    >
      {AGENT_MESSAGE_MODE_HINTS.map((hint) => {
        const isActive = value === hint;
        const { label, description } = AGENT_MESSAGE_MODE_HINT_LABELS[hint];

        return (
          <Button
            key={hint}
            type="button"
            size="xs"
            variant={isActive ? "default" : "outline"}
            disabled={disabled}
            aria-pressed={isActive}
            title={description}
            onClick={() => onChange(isActive ? null : hint)}
            className={cn(
              "h-7 rounded-lg px-2 text-[0.6875rem] font-medium",
              !isActive && "border-border/70 bg-background/60 text-muted-foreground",
            )}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
