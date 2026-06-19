"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PenLine,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentAutoResizeTextarea } from "./AgentAutoResizeTextarea";
import { AgentProposalReviewDialog } from "./AgentProposalReviewDialog";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import type { ArtifactType } from "@/lib/api/services/fetchArtifact";
import { useAppSelector } from "@/lib/redux/hooks";
import { selectUser } from "@/lib/redux/slices/authSlice";
import { cn } from "@/lib/utils";
import { useActiveLlmProviderConfig } from "@/hooks/useLlmProviderConfig";
import {
  useAgentSession,
  useAgentSessionMessages,
  useAgentSessionRealtime,
  useAgentSessionToolCalls,
  useCreateAgentSession,
  useDeleteAgentSession,
  useSendAgentMessage,
  type AgentMessage,
  type AgentMissingContext,
  type AgentSession,
  type AgentSessionRealtimeMode,
  type AgentToolCall,
} from "@/hooks/useAgentSession";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_AGENT_INPUT_LENGTH = 8000;

function formatArtifactType(artifactType: string): string {
  return artifactType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function extractConflictSessionId(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const data = (error as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const id = (data as { session_id?: unknown }).session_id;
  return typeof id === "string" && id ? id : null;
}

function getApiErrorCode(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "number" ? code : null;
}

function formatMissingContext(value: AgentMissingContext): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string" && item.trim()) return [item.trim()];
      if (!item || typeof item !== "object") return [];
      return formatMissingContext(item as Record<string, unknown>);
    });
  }

  return Object.entries(value).flatMap(([key, item]) => {
    if (typeof item === "string" && item.trim()) {
      return [`${key}: ${item.trim()}`];
    }
    if (Array.isArray(item)) {
      const labels = item.filter(
        (entry): entry is string =>
          typeof entry === "string" && Boolean(entry.trim())
      );
      return labels.length ? [`${key}: ${labels.join(", ")}`] : [key];
    }
    if (item === true) return [key];
    return [];
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MissingContextBanner({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400"
      role="status"
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span className="text-pretty">
        <span className="font-medium">Context needed:</span>{" "}
        {items.join(", ")}
      </span>
    </div>
  );
}

function SessionChatPreview({ artifactType }: { artifactType: ArtifactType }) {
  const artifactLabel = formatArtifactType(artifactType);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden opacity-[0.38] select-none"
      aria-hidden
    >
      <div className="flex-1 overflow-hidden px-4 py-4">
        <div className="border-b border-border/60 pb-5">
          <p className="text-balance text-base font-semibold text-foreground">
            Set the brief
          </p>
          <p className="mt-1.5 text-pretty text-xs leading-5 text-muted-foreground">
            Describe the outcome you need for {artifactLabel}. The workbench
            will use it as the drafting direction.
          </p>
        </div>
        <div className="mt-4 ml-auto w-[78%] rounded-lg border border-primary/20 bg-primary/8 px-3 py-2.5">
          <p className="text-pretty text-sm leading-6 text-muted-foreground">
            Draft an {artifactLabel.toLowerCase()} for this project…
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t border-border/60 bg-sidebar p-3">
        <div className="rounded-xl border border-border/80 bg-background/70">
          <div className="px-3.5 pt-3 pb-2 text-sm leading-5 text-muted-foreground">
            Describe the outcome you need…
          </div>
          <div className="flex min-h-10 items-center justify-end px-2.5 pb-2">
            <Button
              type="button"
              size="sm"
              className="pointer-events-none shrink-0 rounded-xl opacity-60"
              tabIndex={-1}
              disabled
            >
              <Send data-icon="inline-start" aria-hidden />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionEmpty({
  artifactType,
  onStart,
  isLoading,
  message,
}: {
  artifactType: ArtifactType;
  onStart: () => void;
  isLoading: boolean;
  message?: string | null;
}) {
  const artifactLabel = formatArtifactType(artifactType);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <SessionChatPreview artifactType={artifactType} />

      <div className="absolute inset-0 flex items-center justify-center bg-background/72 px-5 backdrop-blur-[3px] supports-backdrop-filter:bg-background/58">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--primary)_16%,transparent)_0%,transparent_68%)]"
        />
        <div className="relative flex w-full max-w-[16.5rem] flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-card/55 px-5 py-5 text-center shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_8%,transparent),0_12px_40px_-20px_color-mix(in_oklab,var(--primary)_35%,transparent)] backdrop-blur-sm">
          <div className="flex flex-col gap-1.5">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-primary">
              {artifactLabel}
            </p>
            <h2 className="text-balance text-sm font-semibold text-foreground">
              Start a session
            </h2>
            <p className="text-pretty text-xs leading-5 text-muted-foreground">
              Open the workbench to draft and review before anything is saved.
            </p>
          </div>

          {message ? (
            <p
              className="text-pretty text-xs leading-5 text-amber-700 dark:text-amber-300"
              role="status"
            >
              {message}
            </p>
          ) : null}

          <Button
            type="button"
            size="sm"
            onClick={onStart}
            disabled={isLoading}
            className="min-w-[9.5rem] shadow-[0_0_20px_-6px_color-mix(in_oklab,var(--primary)_55%,transparent)]"
          >
            {isLoading ? (
              <Loader2
                data-icon="inline-start"
                className="animate-spin"
                aria-hidden
              />
            ) : (
              <PenLine data-icon="inline-start" aria-hidden />
            )}
            {isLoading ? "Starting…" : "Start session"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionActive({
  artifactType,
  onCancel,
  isCancelling,
}: {
  artifactType: ArtifactType;
  onCancel: () => void;
  isCancelling: boolean;
}) {
  return (
    <div className="flex flex-1 items-center px-4 py-8">
      <div className="w-full rounded-xl border border-border/70 bg-card/35 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Loader2
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-pretty text-sm font-semibold text-foreground">
              Preparing {formatArtifactType(artifactType)}
            </p>
            <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
              The workbench is connecting and will place progress here as it
              arrives.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isCancelling}
          className="mt-4 w-full text-xs"
        >
          <Trash2 data-icon="inline-start" aria-hidden />
          End session
        </Button>
      </div>
    </div>
  );
}

function AgentThinkingBubble({ agentRole }: { agentRole?: string | null }) {
  return (
    <output
      className="agent-message-enter flex h-8 items-center gap-1 py-2"
      aria-label={
        agentRole
          ? `${formatArtifactType(agentRole)} is preparing a response`
          : "Preparing a response"
      }
    >
      <span className="agent-thinking-dot size-1 rounded-full bg-primary/80" />
      <span className="agent-thinking-dot size-1 rounded-full bg-primary/80" />
      <span className="agent-thinking-dot size-1 rounded-full bg-primary/80" />
    </output>
  );
}

function SessionError({
  message,
  onRetry,
  onReset,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  onReset: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="flex flex-1 items-center px-4 py-8">
      <div className="w-full rounded-xl border border-destructive/25 bg-destructive/8 p-4">
        <div className="flex items-start gap-3">
          <XCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />
          <div>
            <p className="text-balance text-sm font-semibold text-foreground">
              Could not open the drafting session
            </p>
            <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="flex-1 text-xs"
          >
            <RefreshCw
              data-icon="inline-start"
              className={cn(isRetrying && "animate-spin")}
              aria-hidden
            />
            Retry
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            className="flex-1 text-xs"
          >
            Go back
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  message,
  animate,
}: {
  message: AgentMessage;
  animate: boolean;
}) {
  const isAgent = message.role === "agent";
  return (
    <article
      className={cn(
        "flex flex-col",
        isAgent
          ? "py-1"
          : "ml-auto w-fit max-w-[85%] rounded-lg border border-border/60 bg-muted/35 px-3 py-2.5",
        animate && "agent-message-enter"
      )}
    >
      <p className="whitespace-pre-wrap wrap-break-word text-pretty text-sm leading-6 text-foreground">
        {message.content}
      </p>
    </article>
  );
}

function ChatView({
  projectId,
  sessionId,
  onSend,
  isSending,
  isInitialTurn,
  isAgentResponding = false,
  artifactType,
  agentRole,
  realtimeMode,
  realtimeSnapshotCount,
}: {
  projectId: string;
  sessionId: string;
  onSend: (content: string) => void;
  isSending: boolean;
  isInitialTurn: boolean;
  isAgentResponding?: boolean;
  artifactType: ArtifactType;
  agentRole?: string | null;
  realtimeMode: AgentSessionRealtimeMode;
  realtimeSnapshotCount: number;
}) {
  const {
    data: messages = [],
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useAgentSessionMessages(projectId, sessionId, {
    enabled: realtimeMode === "fallback",
  });
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const isComposerBusy = isAgentResponding || isSending;
  const canSend = !isComposerBusy;
  const latestMessageId = messages.at(-1)?.id ?? null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !canSend) return;
    onSend(trimmed);
    setText("");
  }, [canSend, onSend, text]);

  const showCharacterCount = text.length >= MAX_AGENT_INPUT_LENGTH * 0.8;

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isPending ? (
          <div
            className="flex flex-col gap-5"
            role="log"
            aria-live="polite"
            aria-label="Workbench transcript"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="ml-5 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/25 p-3">
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-pretty text-xs text-destructive">
              {getApiErrorMessage(error, "Could not load the workbench history")}
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="gap-2 text-xs"
            >
              <RefreshCw
                className={cn("size-3.5", isFetching && "animate-spin")}
                aria-hidden
              />
              Reload
            </Button>
          </div>
        ) : (
          <div
            className="flex flex-col gap-3"
            role="log"
            aria-live="polite"
            aria-label="Workbench transcript"
          >
            {messages.length === 0 && isInitialTurn ? (
              <div className="border-b border-border/60 pb-5">
                <p className="text-balance font-heading text-base font-semibold text-foreground">
                  Set the brief
                </p>
                <p className="mt-1.5 text-pretty text-xs leading-5 text-muted-foreground">
                  Describe the outcome you need for{" "}
                  {formatArtifactType(artifactType)}. The workbench will use it
                  as the drafting direction.
                </p>
              </div>
            ) : null}
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                animate={
                  realtimeSnapshotCount > 1 && msg.id === latestMessageId
                }
              />
            ))}
            {isAgentResponding ? (
              <AgentThinkingBubble agentRole={agentRole} />
            ) : null}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-sidebar p-3">
        <div
          className="rounded-xl border border-border/80 bg-background/70 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30"
          aria-busy={isComposerBusy}
        >
          <AgentAutoResizeTextarea
            value={text}
            onValueChange={setText}
            onSubmit={handleSend}
            placeholder={
              isAgentResponding
                ? "Workbench is working…"
                : isInitialTurn
                  ? "Describe the outcome you need…"
                  : "Add direction or clarification…"
            }
            aria-label={
              isInitialTurn
                ? "Initial drafting direction"
                : "Additional drafting direction"
            }
            maxLength={MAX_AGENT_INPUT_LENGTH}
            minHeight={56}
            maxHeight={240}
            className="rounded-none border-0 bg-transparent px-3.5 pt-3 pb-2 text-sm leading-5 shadow-none transition-none focus-visible:border-transparent focus-visible:ring-0"
            disabled={!canSend}
          />
          <div className="flex min-h-10 items-center justify-end gap-3 px-2.5 pb-2">
            {showCharacterCount ? (
              <p className="mr-auto min-w-0 truncate text-xs text-muted-foreground tabular-nums">
                {text.length.toLocaleString()}/
                {MAX_AGENT_INPUT_LENGTH.toLocaleString()}
              </p>
            ) : null}
            <Button
              type="button"
              size="sm"
              className="shrink-0 rounded-xl"
              onClick={handleSend}
              disabled={!text.trim() || !canSend}
              aria-label={
                isAgentResponding
                  ? "Workbench is preparing an update"
                  : isSending
                    ? "Sending message"
                    : "Send message"
              }
            >
              {isComposerBusy ? (
                <Loader2
                  data-icon="inline-start"
                  className="animate-spin"
                  aria-hidden
                />
              ) : (
                <Send data-icon="inline-start" aria-hidden />
              )}
              {isAgentResponding
                ? "Working…"
                : isSending
                  ? "Sending…"
                  : "Send"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProposalCard({
  toolCall,
  projectId,
  sessionId,
  artifactType,
}: {
  toolCall: AgentToolCall;
  projectId: string;
  sessionId: string;
  artifactType: ArtifactType;
}) {
  return (
    <AgentProposalReviewDialog
      toolCall={toolCall}
      projectId={projectId}
      sessionId={sessionId}
      artifactType={artifactType}
    />
  );
}

function ProposalsView({
  projectId,
  sessionId,
  artifactType,
  realtimeMode,
}: {
  projectId: string;
  sessionId: string;
  artifactType: ArtifactType;
  realtimeMode: AgentSessionRealtimeMode;
}) {
  const {
    data: toolCalls = [],
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useAgentSessionToolCalls(projectId, sessionId, {
    enabled: realtimeMode === "fallback",
  });

  const proposed = toolCalls.filter((t) => t.status === "proposed");
  const resolved = toolCalls.filter((t) => t.status !== "proposed");

  if (isPending) {
    return (
      <div
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-3"
        aria-busy="true"
        aria-label="Loading draft proposals"
      >
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        <p className="text-pretty text-xs text-destructive">
          {getApiErrorMessage(error, "Could not load draft proposals")}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="gap-2 text-xs"
        >
          <RefreshCw
            className={cn("size-3.5", isFetching && "animate-spin")}
            aria-hidden
          />
          Reload
        </Button>
      </div>
    );
  }

  if (!toolCalls.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">No proposals available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
      {proposed.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-balance text-sm font-semibold text-foreground">
              Review queue ({proposed.length})
            </h2>
            <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
              Inspect each draft before approving, rejecting, or sending it
              back for revision.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {proposed.map((tc) => (
              <ProposalCard
                key={tc.id}
                toolCall={tc}
                projectId={projectId}
                sessionId={sessionId}
                artifactType={artifactType}
              />
            ))}
          </div>
        </section>
      )}
      {resolved.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-balance text-sm font-semibold text-muted-foreground">
            Decision history ({resolved.length})
          </h2>
          <div className="flex flex-col gap-2">
            {resolved.map((tc) => (
              <ProposalCard
                key={tc.id}
                toolCall={tc}
                projectId={projectId}
                sessionId={sessionId}
                artifactType={artifactType}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SessionDone({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center px-4 py-8">
      <div className="w-full rounded-xl border border-primary/25 bg-primary/8 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-primary"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Drafting complete
            </p>
            <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
              The output is now available in the artifact list for your review.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          className="mt-4 w-full text-xs"
        >
          <RefreshCw data-icon="inline-start" aria-hidden />
          Start another session
        </Button>
      </div>
    </div>
  );
}

function SessionFailed({
  projectId,
  sessionId,
  onReset,
  realtimeMode,
}: {
  projectId: string;
  sessionId: string;
  onReset: () => void;
  realtimeMode: AgentSessionRealtimeMode;
}) {
  const { data: messages = [] } = useAgentSessionMessages(
    projectId,
    sessionId,
    { enabled: realtimeMode === "fallback" }
  );
  const lastAgentMsg = [...messages].reverse().find((m) => m.role === "agent");

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      <div className="rounded-xl border border-destructive/25 bg-destructive/8 p-4">
        <div className="flex items-start gap-3">
          <XCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Drafting stopped
            </p>
            <p className="mt-1 text-pretty text-xs leading-5 text-muted-foreground">
              The workbench could not finish this run. Check LLM Settings or
              start again.
            </p>
          </div>
        </div>
      </div>

      {lastAgentMsg && (
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">
            Last workbench note
          </p>
          <p className="text-xs leading-relaxed text-foreground/80">
            {lastAgentMsg.content}
          </p>
        </div>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={onReset}
        className="w-full text-xs"
      >
        <RefreshCw data-icon="inline-start" aria-hidden />
        Try again
      </Button>
    </div>
  );
}

function AgentSessionHeader({
  artifactType,
  status,
  realtimeMode,
  isStreaming,
  isDeleting,
  onCancel,
}: {
  artifactType: ArtifactType;
  status: AgentSession["status"] | null;
  realtimeMode: AgentSessionRealtimeMode;
  isStreaming: boolean;
  isDeleting: boolean;
  onCancel: () => void;
}) {
  const connectionLabel =
    realtimeMode === "fallback"
      ? "Polling"
      : realtimeMode === "connecting"
        ? "Connecting"
        : realtimeMode === "live"
          ? "Live"
          : realtimeMode === "closed"
            ? "Closed"
            : "Ready";

  const connectionDescription =
    realtimeMode === "fallback"
      ? "Using fallback polling"
      : realtimeMode === "live"
        ? "Receiving realtime snapshots over SSE"
        : realtimeMode === "connecting"
          ? "Connecting to the realtime stream"
          : realtimeMode === "closed"
            ? "The backend closed the stream after the session ended"
            : "No active drafting session";

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-sidebar px-4 py-3.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-background/70 text-primary">
        {isStreaming && (status === "active" || status === null) ? (
          <Loader2
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden
          />
        ) : (
          <PenLine className="size-4" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-sm font-semibold text-foreground">
          Artifact workbench
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatArtifactType(artifactType)}
        </p>
      </div>
      <span
        className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"
        title={connectionDescription}
        aria-label={connectionDescription}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            realtimeMode === "live"
              ? "bg-primary"
              : realtimeMode === "fallback"
                ? "bg-amber-400"
                : "bg-muted-foreground/60",
            realtimeMode === "connecting" &&
              "animate-pulse motion-reduce:animate-none"
          )}
        />
        {connectionLabel}
      </span>
      {status && status !== "completed" && status !== "failed" ? (
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          title="End drafting session"
          aria-label="End drafting session"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="size-3.5" aria-hidden />
          )}
        </button>
      ) : null}
    </div>
  );
}

type AgentSessionView =
  | { kind: "empty"; isCreating: boolean; message: string | null }
  | { kind: "error"; isRetrying: boolean; message: string }
  | { kind: "connecting"; isDeleting: boolean }
  | { kind: "active"; agentRole: string | null }
  | { kind: "chat"; agentRole: string | null; isInitialTurn: boolean }
  | { kind: "proposals" }
  | { kind: "completed" }
  | { kind: "failed" };

function resolveAgentSessionView({
  sessionId,
  session,
  isMissingSession,
  isSessionError,
  sessionError,
  sessionErrorCode,
  isSessionPending,
  isSessionFetching,
  isCreating,
  isDeleting,
  startError,
  sessionNotice,
}: {
  sessionId: string | null;
  session: AgentSession | undefined;
  isMissingSession: boolean;
  isSessionError: boolean;
  sessionError: unknown;
  sessionErrorCode: number | null;
  isSessionPending: boolean;
  isSessionFetching: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  startError: string | null;
  sessionNotice: string | null;
}): AgentSessionView {
  if (!sessionId || isMissingSession) {
    return {
      kind: "empty",
      isCreating,
      message:
        startError ??
        sessionNotice ??
        (isMissingSession
          ? "This drafting session no longer exists or you no longer have access. You can start a new session."
          : null),
    };
  }

  if (isSessionError) {
    return {
      kind: "error",
      isRetrying: isSessionFetching,
      message:
        sessionErrorCode === 503
          ? "The drafting service is not ready yet. Wait a moment and try again."
          : getApiErrorMessage(
              sessionError,
              "Could not load the drafting session status"
            ),
    };
  }

  if (isCreating || isSessionPending || !session) {
    return { kind: "connecting", isDeleting };
  }

  if (session.status === "active") {
    return { kind: "active", agentRole: session.agentRole };
  }

  if (
    session.status === "waiting_for_human" &&
    (session.interruptType === null || session.interruptType === "ask_human")
  ) {
    return {
      kind: "chat",
      agentRole: session.agentRole,
      isInitialTurn: session.interruptType === null,
    };
  }

  if (
    session.status === "waiting_for_human" &&
    session.interruptType === "propose_artifacts"
  ) {
    return { kind: "proposals" };
  }

  if (session.status === "completed") return { kind: "completed" };
  if (session.status === "failed") return { kind: "failed" };
  return { kind: "connecting", isDeleting };
}

function AgentSessionBody({
  projectId,
  sessionId,
  artifactType,
  view,
  realtimeMode,
  realtimeSnapshotCount,
  isSending,
  onStart,
  onRetry,
  onReset,
  onCancel,
  onSend,
}: {
  projectId: string | null;
  sessionId: string | null;
  artifactType: ArtifactType;
  view: AgentSessionView;
  realtimeMode: AgentSessionRealtimeMode;
  realtimeSnapshotCount: number;
  isSending: boolean;
  onStart: () => void;
  onRetry: () => void;
  onReset: () => void;
  onCancel: () => void;
  onSend: (content: string) => void;
}) {
  let content: React.ReactNode;

  switch (view.kind) {
    case "empty":
      content = (
        <SessionEmpty
          artifactType={artifactType}
          onStart={onStart}
          isLoading={view.isCreating}
          message={view.message}
        />
      );
      break;
    case "error":
      content = (
        <SessionError
          message={view.message}
          onRetry={onRetry}
          onReset={onReset}
          isRetrying={view.isRetrying}
        />
      );
      break;
    case "connecting":
      content = (
        <SessionActive
          artifactType={artifactType}
          onCancel={onCancel}
          isCancelling={view.isDeleting}
        />
      );
      break;
    case "active":
      content = (
        <ChatView
          projectId={projectId!}
          sessionId={sessionId!}
          onSend={onSend}
          isSending={isSending}
          isInitialTurn={false}
          isAgentResponding
          artifactType={artifactType}
          agentRole={view.agentRole}
          realtimeMode={realtimeMode}
          realtimeSnapshotCount={realtimeSnapshotCount}
        />
      );
      break;
    case "chat":
      content = (
        <ChatView
          projectId={projectId!}
          sessionId={sessionId!}
          onSend={onSend}
          isSending={isSending}
          isInitialTurn={view.isInitialTurn}
          artifactType={artifactType}
          agentRole={view.agentRole}
          realtimeMode={realtimeMode}
          realtimeSnapshotCount={realtimeSnapshotCount}
        />
      );
      break;
    case "proposals":
      content = (
        <ProposalsView
          projectId={projectId!}
          sessionId={sessionId!}
          artifactType={artifactType}
          realtimeMode={realtimeMode}
        />
      );
      break;
    case "completed":
      content = <SessionDone onReset={onReset} />;
      break;
    case "failed":
      content = (
        <SessionFailed
          projectId={projectId!}
          sessionId={sessionId!}
          onReset={onReset}
          realtimeMode={realtimeMode}
        />
      );
      break;
  }

  return (
    <div
      key={view.kind}
      className="agent-session-state-enter flex min-h-0 flex-1 flex-col"
      aria-busy={view.kind === "active"}
    >
      {content}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type AgentSessionSidebarProps = {
  projectId: string | null;
  artifactType: ArtifactType;
};

export function AgentSessionSidebar({
  projectId,
  artifactType,
}: AgentSessionSidebarProps) {
  const currentUser = useAppSelector(selectUser);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [missingContext, setMissingContext] = useState<string[]>([]);
  const [startError, setStartError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const sessionStorageKey = projectId && currentUser?.id
    ? `agent-session:${currentUser.id}:${projectId}:${artifactType}`
    : null;

  // Restore the session for the exact project + artifact pair.
  useEffect(() => {
    if (!sessionStorageKey) return;
    let cancelled = false;
    try {
      const saved = sessionStorage.getItem(sessionStorageKey);
      if (!saved) return;
      queueMicrotask(() => {
        if (!cancelled) setSessionIdState(saved);
      });
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
    return () => {
      cancelled = true;
    };
  }, [sessionStorageKey]);

  const setSessionId = useCallback(
    (id: string | null) => {
      setSessionIdState(id);
      if (!sessionStorageKey) return;
      try {
        if (id) sessionStorage.setItem(sessionStorageKey, id);
        else sessionStorage.removeItem(sessionStorageKey);
      } catch {
        // Session persistence is a convenience; in-memory state still works.
      }
    },
    [sessionStorageKey]
  );

  const { data: activeConfig } = useActiveLlmProviderConfig();
  const realtime = useAgentSessionRealtime(projectId, sessionId);

  const {
    data: session,
    isPending: isSessionPending,
    isError: isSessionError,
    error: sessionError,
    isFetching: isSessionFetching,
    refetch: refetchSession,
  } = useAgentSession(projectId, sessionId, {
    enabled: realtime.isFallback,
    pollingEnabled: realtime.isFallback,
  });

  const sessionErrorCode = getApiErrorCode(sessionError);
  const isMissingSession = isSessionError && sessionErrorCode === 404;

  useEffect(() => {
    if (!sessionId || !isSessionError || sessionErrorCode !== 404) return;
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      setSessionId(null);
      setMissingContext([]);
      setSessionNotice(
        "This drafting session no longer exists or you no longer have access. You can start a new session."
      );
    });

    return () => {
      cancelled = true;
    };
  }, [isSessionError, sessionErrorCode, sessionId, setSessionId]);

  const createSession = useCreateAgentSession({
    onSuccess: (res) => {
      setStartError(null);
      setSessionNotice(null);
      setSessionId(res.data.sessionId);
      setMissingContext(res.data.missingContext);
    },
    onError: (error) => {
      const conflictId = extractConflictSessionId(error);
      if (conflictId) {
        setStartError(null);
        setSessionNotice("Reopened your active drafting session.");
        setSessionId(conflictId);
        return;
      }
      setStartError(
        getApiErrorMessage(error, "Could not create drafting session")
      );
    },
  });

  const deleteSession = useDeleteAgentSession({
    onSuccess: () => {
      setCancelDialogOpen(false);
      setSessionId(null);
      setMissingContext([]);
      setSessionNotice("The drafting session was ended.");
    },
  });

  const sendMessage = useSendAgentMessage();

  const handleStart = useCallback(() => {
    if (!projectId) return;
    setStartError(null);
    setSessionNotice(null);
    createSession.mutate({
      projectId,
      req: {
        artifact_type: artifactType,
        step_key: null,
        workflow_area: "analysis",
        agent_role: null,
        provider_config_id: activeConfig?.id ?? null,
      },
    });
  }, [projectId, artifactType, activeConfig, createSession]);

  const handleConfirmCancel = useCallback(() => {
    if (!projectId || !sessionId) return;
    deleteSession.mutate({ projectId, sessionId });
  }, [projectId, sessionId, deleteSession]);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (
        !projectId ||
        !sessionId ||
        session?.status !== "waiting_for_human" ||
        (session.interruptType !== null &&
          session.interruptType !== "ask_human")
      ) {
        void refetchSession();
        return;
      }
      sendMessage.mutate({ projectId, sessionId, req: { content } });
    },
    [projectId, refetchSession, sendMessage, session, sessionId]
  );

  const handleReset = useCallback(() => {
    setSessionId(null);
    setMissingContext([]);
    setStartError(null);
    setSessionNotice(null);
  }, [setSessionId]);

  const status = session?.status ?? null;
  const restoredMissingContext = formatMissingContext(
    session?.missingContext ?? null
  );
  const visibleMissingContext =
    restoredMissingContext.length > 0
      ? restoredMissingContext
      : missingContext;

  const isCreating = createSession.isPending;
  const isDeleting = deleteSession.isPending;
  const view = resolveAgentSessionView({
    sessionId,
    session,
    isMissingSession,
    isSessionError,
    sessionError,
    sessionErrorCode,
    isSessionPending,
    isSessionFetching,
    isCreating,
    isDeleting,
    startError,
    sessionNotice,
  });

  return (
    <>
      <aside
        className="flex h-full min-h-0 w-96 shrink-0 flex-col overflow-hidden border-l border-border/70 bg-sidebar"
        aria-label="Artifact workbench"
      >
        {/* Header */}
        <AgentSessionHeader
          artifactType={artifactType}
          status={status}
          realtimeMode={realtime.mode}
          isStreaming={realtime.isStreaming}
          isDeleting={isDeleting}
          onCancel={() => setCancelDialogOpen(true)}
        />

        {/* Missing context warning */}
        {visibleMissingContext.length > 0 && (
          <div className="shrink-0 px-3 pt-3">
            <MissingContextBanner items={visibleMissingContext} />
          </div>
        )}

        {/* Body */}
        <AgentSessionBody
          projectId={projectId}
          sessionId={sessionId}
          artifactType={artifactType}
          view={view}
          realtimeMode={realtime.mode}
          realtimeSnapshotCount={realtime.snapshotCount}
          isSending={sendMessage.isPending}
          onStart={handleStart}
          onRetry={() => void refetchSession()}
          onReset={handleReset}
          onCancel={() => setCancelDialogOpen(true)}
          onSend={handleSendMessage}
        />
      </aside>
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End drafting session?</AlertDialogTitle>
            <AlertDialogDescription>
              The current run and its progress will be deleted. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Keep working
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-4" aria-hidden />
              )}
              End session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
