"use client";

import { createContext, use, useCallback, useMemo } from "react";
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAuiState,
  useExternalStoreRuntime,
  type AppendMessage,
  type ExternalThreadQueueAdapter,
  type TextMessagePartProps,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { ArrowDown, ArrowRight, Loader2, Send } from "lucide-react";

import { MarkdownContent } from "@/components/shared/markdownContent";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  AgentMessage,
  AgentMessagePayload,
  AgentMessagePayloadOption,
} from "@/hooks/useAgentSession";
import type { AgentMessageModeHint } from "@/lib/api/services/fetchAgentSession";

import {
  SHOW_AGENT_MESSAGE_MODE_HINT_UI,
} from "./agentMessageModeHint";
import { AgentMessageModeHintPicker } from "./agentMessageModeHintPicker";

const MAX_AGENT_INPUT_LENGTH = 8000;

export type AgentThreadSendHandler = (
  content: string,
  modeHint?: AgentMessageModeHint | null,
) => void;

type AgentThreadContextValue = {
  agentRole?: string | null;
  onSend: AgentThreadSendHandler;
};

const AgentThreadContext = createContext<AgentThreadContextValue | null>(null);

function useAgentThreadContext() {
  const context = use(AgentThreadContext);
  if (!context) {
    throw new Error(
      "AgentAssistantThread components must be rendered inside its provider"
    );
  }
  return context;
}

function formatItemType(itemType: string): string {
  return itemType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatPayloadKind(kind: string): string {
  return kind
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getAppendMessageText(message: AppendMessage): string {
  return message.content
    .flatMap((part) => (part.type === "text" ? [part.text] : []))
    .join("\n")
    .trim();
}

function getAgentPayload(value: unknown): AgentMessagePayload {
  if (!value || typeof value !== "object") return null;
  return value as AgentMessagePayload;
}

function AgentThinkingIndicator() {
  const { agentRole } = useAgentThreadContext();

  return (
    <output
      className="agent-message-enter flex h-8 items-center gap-1 py-2"
      aria-label={
        agentRole
          ? `${formatItemType(agentRole)} is preparing a response`
          : "Preparing a response"
      }
    >
      <span className="agent-thinking-dot size-1 rounded-full bg-primary/80" />
      <span className="agent-thinking-dot size-1 rounded-full bg-primary/80" />
      <span className="agent-thinking-dot size-1 rounded-full bg-primary/80" />
    </output>
  );
}

function AgentMessageText({ text, status }: TextMessagePartProps) {
  const role = useAuiState((state) => state.message.role);

  if (!text && status.type === "running") {
    return <AgentThinkingIndicator />;
  }

  if (role === "user") {
    return (
      <p className="whitespace-pre-wrap wrap-break-word text-pretty text-sm leading-6 text-foreground">
        {text}
      </p>
    );
  }

  return (
    <>
      <MarkdownContent content={text} className="min-w-0" />
      {status.type === "running" ? <AgentThinkingIndicator /> : null}
    </>
  );
}

function AgentPayloadBlocks({ payload }: { payload: AgentMessagePayload }) {
  const blocks = payload?.blocks ?? [];
  if (!blocks.length) return null;

  return (
    <div className="mt-3 grid gap-2 rounded-xl border border-border/60 bg-muted/20 p-3">
      {blocks.map((block) => {
        if (block.type === "heading" && typeof block.text === "string") {
          return (
            <h3
              key={`${block.type}-${block.text}`}
              className="text-sm font-semibold leading-5 text-foreground"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "list" && Array.isArray(block.items)) {
          return (
            <ul
              key={`${block.type}-${block.items.join("\u001f")}`}
              className="grid gap-1.5 pl-4 text-sm leading-5 text-foreground/85"
            >
              {block.items
                .filter((item): item is string => typeof item === "string")
                .map((item) => (
                  <li key={item} className="list-disc">
                    {item}
                  </li>
                ))}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
}

function AgentThreadMessage() {
  const { onSend } = useAgentThreadContext();
  const role = useAuiState((state) => state.message.role);
  const custom = useAuiState((state) => state.message.metadata.custom);
  const payload = getAgentPayload(custom.agentPayload);
  const animate = custom.animate === true;
  const hideOptions = custom.hideOptions === true;
  const isAgent = role === "assistant";
  const isQueued = payload?.queued === true;
  const payloadLabel = payload?.kind
    ? formatPayloadKind(payload.kind)
    : null;
  const localeLabel = payload?.locale
    ? payload.locale.toUpperCase()
    : null;
  const options = isAgent && !hideOptions ? (payload?.options ?? []) : [];

  return (
    <MessagePrimitive.Root
      className={cn(
        "relative min-w-0 pt-3 first:pt-0",
        isQueued && "opacity-65",
        animate && "agent-message-enter"
      )}
    >
      <article
        className={cn(
          "flex min-w-0 flex-col",
          isAgent
            ? "w-full py-1"
            : "ml-auto w-fit max-w-[85%] rounded-xl border border-border/65 bg-muted/35 px-3.5 py-2.5 shadow-xs"
        )}
      >
        <MessagePrimitive.Parts components={{ Text: AgentMessageText }} />

        {payloadLabel || isQueued ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {payloadLabel ? (
              <span className="rounded-md border border-primary/20 bg-primary/8 px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase leading-none tracking-[0.12em] text-primary">
                {payloadLabel}
              </span>
            ) : null}
            {localeLabel ? (
              <span className="text-[0.625rem] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground">
                {localeLabel}
              </span>
            ) : null}
            {isQueued ? (
              <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground">
                <Loader2
                  className="size-3 animate-spin motion-reduce:animate-none"
                  aria-hidden
                />
                Queued
              </span>
            ) : null}
          </div>
        ) : null}

        {isAgent ? <AgentPayloadBlocks payload={payload} /> : null}

        {options.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((option) => (
              <Button
                key={option.id || option.value}
                type="button"
                size="xs"
                variant="outline"
                onClick={() => onSend(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : null}
      </article>
    </MessagePrimitive.Root>
  );
}

function AgentComposer({
  isAwaitingAgentReply,
  isInitialTurn,
  isSending,
  modeHint,
  onModeHintChange,
}: {
  isAwaitingAgentReply: boolean;
  isInitialTurn: boolean;
  isSending: boolean;
  modeHint: AgentMessageModeHint | null;
  onModeHintChange: (value: AgentMessageModeHint | null) => void;
}) {
  const text = useAuiState((state) => state.composer.text);
  const showCharacterCount =
    text.length >= MAX_AGENT_INPUT_LENGTH * 0.8;
  const isComposerLocked = isSending || isAwaitingAgentReply;

  return (
    <div className="shrink-0 border-t border-border/60 bg-sidebar p-3">
      <ComposerPrimitive.Root
        className="rounded-xl border border-border/80 bg-background/78 shadow-sm transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25"
        aria-busy={isComposerLocked}
      >
        {SHOW_AGENT_MESSAGE_MODE_HINT_UI ? (
          <div className="border-b border-border/50 px-2.5 pt-2.5 pb-2">
            <AgentMessageModeHintPicker
              value={modeHint}
              onChange={onModeHintChange}
              disabled={isComposerLocked}
            />
          </div>
        ) : null}
        <ComposerPrimitive.Input
          placeholder={
            isAwaitingAgentReply
              ? "Waiting for the workbench to finish…"
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
          minRows={2}
          maxRows={9}
          disabled={isComposerLocked}
          submitMode="enter"
          className="block min-h-14 w-full resize-none bg-transparent px-3.5 pt-3 pb-2 text-sm leading-5 text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-55"
        />
        <div className="flex min-h-10 items-center justify-end gap-2 px-2.5 pb-2">
          {showCharacterCount ? (
            <p className="mr-auto min-w-0 truncate text-xs text-muted-foreground tabular-nums">
              {text.length.toLocaleString()}/
              {MAX_AGENT_INPUT_LENGTH.toLocaleString()}
            </p>
          ) : (
            <p className="mr-auto pl-1 text-[0.6875rem] text-muted-foreground/75">
              {isAwaitingAgentReply ? "Reply when the workbench is ready" : "Enter to send"}
            </p>
          )}
          <ComposerPrimitive.Send
            className={cn(
              buttonVariants({ size: "icon-xs" }),
              "rounded-xl"
            )}
            disabled={isComposerLocked}
            aria-label={
              isAwaitingAgentReply
                ? "Send disabled while the workbench is responding"
                : isSending
                  ? "Sending message"
                  : "Send message"
            }
          >
            {isSending ? (
              <Loader2
                className="size-3.5 animate-spin motion-reduce:animate-none"
                aria-hidden
              />
            ) : (
              <Send className="size-3.5" aria-hidden />
            )}
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </div>
  );
}

function AgentDecisionFooter({
  decisionOptions,
  isSending,
  onSend,
}: {
  decisionOptions: AgentMessagePayloadOption[];
  isSending: boolean;
  onSend: AgentThreadSendHandler;
}) {
  return (
    <div
      className="shrink-0 border-t border-border/60 bg-sidebar p-3"
      aria-busy={isSending}
    >
      <fieldset className="grid gap-2">
        <legend className="sr-only">Choose the next artifact action</legend>
        {decisionOptions.map((option, index) => (
          <Button
            key={option.id || option.value}
            type="button"
            variant={index === 0 ? "default" : "outline"}
            onClick={() => onSend(option.value)}
            disabled={isSending}
            className="h-auto min-h-11 justify-between rounded-xl px-4 py-3 text-left"
          >
            <span className="text-pretty">{option.label}</span>
            <ArrowRight data-icon="inline-end" aria-hidden />
          </Button>
        ))}
      </fieldset>
    </div>
  );
}

export function AgentAssistantThread({
  messages,
  onSend,
  isSending,
  isInitialTurn,
  isAwaitingAgentReply,
  itemType,
  agentRole,
  realtimeSnapshotCount,
  decisionOptions,
  modeHint,
  onModeHintChange,
}: {
  messages: AgentMessage[];
  onSend: AgentThreadSendHandler;
  isSending: boolean;
  isInitialTurn: boolean;
  isAwaitingAgentReply: boolean;
  itemType: string;
  agentRole?: string | null;
  realtimeSnapshotCount: number;
  decisionOptions: AgentMessagePayloadOption[];
  modeHint: AgentMessageModeHint | null;
  onModeHintChange: (value: AgentMessageModeHint | null) => void;
}) {
  const latestMessageId = messages.at(-1)?.id ?? null;
  const isDecisionMode = decisionOptions.length > 0;

  const sendAppendMessage = useCallback(
    (message: AppendMessage) => {
      const content = getAppendMessageText(message);
      if (!content) return;
      onSend(
        content,
        SHOW_AGENT_MESSAGE_MODE_HINT_UI ? modeHint : null,
      );
    },
    [modeHint, onSend]
  );

  const queue = useMemo<ExternalThreadQueueAdapter>(
    () => ({
      items: [],
      enqueue: sendAppendMessage,
      steer: () => undefined,
      remove: () => undefined,
      clear: () => undefined,
    }),
    [sendAppendMessage]
  );

  const convertMessage = useCallback(
    (message: AgentMessage): ThreadMessageLike => ({
      id: message.id,
      role: message.role === "agent" ? "assistant" : "user",
      content: message.content,
      createdAt: message.createdAt
        ? new Date(message.createdAt)
        : undefined,
      metadata: {
        custom: {
          agentPayload: message.payload,
          animate:
            realtimeSnapshotCount > 1 &&
            message.id === latestMessageId,
          hideOptions:
            isDecisionMode && message.id === latestMessageId,
        },
      },
    }),
    [
      isDecisionMode,
      latestMessageId,
      realtimeSnapshotCount,
    ]
  );

  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage,
    isRunning: isAwaitingAgentReply,
    isSendDisabled: isSending || isAwaitingAgentReply,
    queue,
    onNew: async (message) => {
      sendAppendMessage(message);
    },
  });

  const contextValue = useMemo(
    () => ({ agentRole, onSend }),
    [agentRole, onSend]
  );

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AgentThreadContext.Provider value={contextValue}>
        <ThreadPrimitive.Root className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <ThreadPrimitive.Viewport
            turnAnchor="top"
            scrollToBottomOnRunStart={false}
            className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4"
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
                  {formatItemType(itemType)}. The workbench will use it
                  as the drafting direction.
                </p>
              </div>
            ) : null}

            <ThreadPrimitive.Messages
              components={{ Message: AgentThreadMessage }}
            />

            <ThreadPrimitive.ScrollToBottom
              behavior="smooth"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon-xs" }),
                "sticky bottom-2 z-10 -mt-8 self-center rounded-full bg-background/90 shadow-md backdrop-blur-sm disabled:hidden"
              )}
              aria-label="Scroll to latest message"
            >
              <ArrowDown className="size-3.5" aria-hidden />
            </ThreadPrimitive.ScrollToBottom>
          </ThreadPrimitive.Viewport>

          {isDecisionMode ? (
            <AgentDecisionFooter
              decisionOptions={decisionOptions}
              isSending={isSending}
              onSend={onSend}
            />
          ) : (
            <AgentComposer
              isAwaitingAgentReply={isAwaitingAgentReply}
              isInitialTurn={isInitialTurn}
              isSending={isSending}
              modeHint={modeHint}
              onModeHintChange={onModeHintChange}
            />
          )}
        </ThreadPrimitive.Root>
      </AgentThreadContext.Provider>
    </AssistantRuntimeProvider>
  );
}
