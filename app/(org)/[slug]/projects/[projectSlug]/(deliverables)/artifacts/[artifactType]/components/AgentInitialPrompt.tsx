"use client";

import { useCallback, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSendAgentMessage } from "@/hooks/useAgentSession";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import { getInitialDocumentItemPrompt } from "@/lib/document/documentItemPrompts";
import { cn } from "@/lib/utils";

function formatItemType(itemType: string): string {
  return itemType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/** @deprecated Legacy artifact prompts — use getInitialDocumentItemPrompt. */
export function getInitialArtifactPrompt(itemType: string): string {
  return getInitialDocumentItemPrompt(itemType);
}

export type AgentInitialPromptAttempt = {
  sessionId: string;
  content: string;
  error: string | null;
};

export function useAgentInitialPrompt() {
  const [attempt, setAttempt] =
    useState<AgentInitialPromptAttempt | null>(null);
  const message = useSendAgentMessage({
    onSuccess: (_data, variables) => {
      setAttempt((current) =>
        current?.sessionId === variables.sessionId ? null : current
      );
    },
    onError: (error, variables) => {
      setAttempt((current) =>
        current?.sessionId === variables.sessionId
          ? {
              ...current,
              error: getApiErrorMessage(
                error,
                "Could not send the first artifact direction"
              ),
            }
          : current
      );
    },
  });

  const send = useCallback(
    (projectId: string, sessionId: string, content: string) => {
      setAttempt({ sessionId, content, error: null });
      message.mutate({
        projectId,
        sessionId,
        req: { content },
      });
    },
    [message]
  );

  const retry = useCallback(
    (projectId: string) => {
      if (!attempt) return;
      send(projectId, attempt.sessionId, attempt.content);
    },
    [attempt, send]
  );

  const clear = useCallback(() => {
    setAttempt(null);
  }, []);

  return {
    attempt,
    isSending: message.isPending,
    send,
    retry,
    clear,
  };
}

export function AgentInitialPromptState({
  itemType,
  prompt,
  error,
  isSending,
  onRetry,
}: {
  itemType: string;
  prompt: string;
  error: string | null;
  isSending: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
      <div className="border-b border-border/60 pb-4">
        <p className="text-balance font-heading text-base font-semibold text-foreground">
          Starting {formatItemType(itemType)}
        </p>
        <p className="mt-1.5 text-pretty text-xs leading-5 text-muted-foreground">
          The workbench is sending a tailored first direction for this artifact.
        </p>
      </div>

      <div className="mt-4 ml-auto w-fit max-w-[88%] rounded-lg border border-border/60 bg-muted/35 px-3 py-2.5">
        <p className="whitespace-pre-wrap wrap-break-word text-pretty text-sm leading-6 text-foreground">
          {prompt}
        </p>
      </div>

      {error ? (
        <div
          className="mt-4 rounded-xl border border-destructive/25 bg-destructive/8 p-3"
          role="alert"
        >
          <p className="text-pretty text-xs leading-5 text-destructive">
            {error}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isSending}
            className="mt-3"
          >
            <RefreshCw
              data-icon="inline-start"
              className={cn(isSending && "animate-spin")}
              aria-hidden
            />
            Retry first message
          </Button>
        </div>
      ) : (
        <output className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2
            className="size-3.5 animate-spin motion-reduce:animate-none"
            aria-hidden
          />
          Sending the first direction…
        </output>
      )}
    </div>
  );
}
