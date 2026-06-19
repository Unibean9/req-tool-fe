"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  WandSparkles,
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
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import type { ArtifactType } from "@/lib/api/services/fetchArtifact";
import { cn } from "@/lib/utils";
import { useActiveLlmProviderConfig } from "@/hooks/useLlmProviderConfig";
import {
  useAgentSession,
  useAgentSessionMessages,
  useAgentSessionToolCalls,
  useApproveToolCall,
  useCreateAgentSession,
  useDeleteAgentSession,
  useRejectToolCall,
  useRequestEditToolCall,
  useSendAgentMessage,
  type AgentMessage,
  type AgentMissingContext,
  type AgentToolCall,
} from "@/hooks/useAgentSession";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAX_AGENT_INPUT_LENGTH = 8000;

function agentStepKey(artifactType: ArtifactType): string {
  return `analysis.${artifactType}`;
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function MissingContextBanner({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <div
      className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400"
      role="status"
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span className="text-pretty">
        <span className="font-medium">Thiếu context:</span>{" "}
        {items.join(", ")}
      </span>
    </div>
  );
}

function SessionEmpty({
  onStart,
  isLoading,
  message,
}: {
  onStart: () => void;
  isLoading: boolean;
  message?: string | null;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <WandSparkles className="size-6 text-primary" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Hỏi AI</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Agent sẽ phân tích context và đề xuất artifact cho type này.
        </p>
        {message ? (
          <p className="mt-2 text-pretty text-xs text-amber-400" role="status">
            {message}
          </p>
        ) : null}
      </div>
      <Button
        size="sm"
        onClick={onStart}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Sparkles className="size-3.5" aria-hidden />
        )}
        {isLoading ? "Đang khởi tạo…" : "Bắt đầu phiên AI"}
      </Button>
    </div>
  );
}

function SessionActive({ onCancel, isCancelling }: { onCancel: () => void; isCancelling: boolean }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <div className="relative flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Bot className="size-6 text-primary" aria-hidden />
        <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary">
          <Loader2 className="size-2.5 animate-spin text-primary-foreground" aria-hidden />
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Agent đang phân tích…</p>
        <p className="text-xs text-muted-foreground">Vui lòng đợi trong giây lát.</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onCancel}
        disabled={isCancelling}
        className="gap-2 text-xs"
      >
        <Trash2 className="size-3.5" aria-hidden />
        Huỷ phiên
      </Button>
    </div>
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="size-5 text-destructive" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-balance text-sm font-medium text-foreground">
          Không tải được phiên agent
        </p>
        <p className="text-pretty text-xs leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="gap-2 text-xs"
        >
          <RefreshCw
            className={cn("size-3.5", isRetrying && "animate-spin")}
            aria-hidden
          />
          Thử lại
        </Button>
        <Button size="sm" variant="outline" onClick={onReset} className="text-xs">
          Quay lại
        </Button>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: AgentMessage }) {
  const isAgent = message.role === "agent";
  return (
    <div className={cn("flex gap-2", isAgent ? "items-start" : "items-start flex-row-reverse")}>
      <div
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          isAgent
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        )}
        aria-hidden
      >
        {isAgent ? <Bot className="size-3.5" /> : "U"}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed",
          isAgent
            ? "rounded-tl-sm bg-muted/60 text-foreground"
            : "rounded-tr-sm bg-primary text-primary-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

function ChatView({
  projectId,
  sessionId,
  onSend,
  isSending,
}: {
  projectId: string;
  sessionId: string;
  onSend: (content: string) => void;
  isSending: boolean;
}) {
  const {
    data: messages = [],
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useAgentSessionMessages(projectId, sessionId);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    onSend(trimmed);
    setText("");
  }, [text, isSending, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-1 flex-col gap-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isPending ? (
          <div
            className="space-y-3"
            role="log"
            aria-live="polite"
            aria-label="Lịch sử hội thoại với agent"
          >
            <div className="h-10 w-3/4 animate-pulse rounded-xl bg-muted/60" />
            <div className="ml-auto h-8 w-2/3 animate-pulse rounded-xl bg-muted/60" />
          </div>
        ) : isError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="text-pretty text-xs text-destructive">
              {getApiErrorMessage(error, "Không tải được lịch sử hội thoại")}
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
              Tải lại
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-border/60 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Trả lời… (⌘↵ để gửi)"
            aria-label="Nội dung trả lời cho agent"
            maxLength={MAX_AGENT_INPUT_LENGTH}
            rows={2}
            className="min-h-0 flex-1 resize-none text-xs"
            disabled={isSending}
          />
          <Button
            size="icon"
            className="size-8 shrink-0"
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            aria-label="Gửi"
          >
            {isSending ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Send className="size-3.5" aria-hidden />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProposalCard({
  toolCall,
  projectId,
  sessionId,
}: {
  toolCall: AgentToolCall;
  projectId: string;
  sessionId: string;
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [editNote, setEditNote] = useState("");

  const approve = useApproveToolCall();
  const reject = useRejectToolCall();
  const requestEdit = useRequestEditToolCall();

  const snapshot = toolCall.inputSnapshot as {
    artifact_type?: string;
    title?: string;
    body?: string;
  };

  const isResolved = toolCall.status !== "proposed";
  const isBusy =
    approve.isPending || reject.isPending || requestEdit.isPending;

  const handleApprove = () => {
    approve.mutate({ projectId, sessionId, toolCallId: toolCall.id });
  };

  const handleReject = () => {
    reject.mutate({ projectId, sessionId, toolCallId: toolCall.id });
  };

  const handleRequestEdit = () => {
    if (!editNote.trim()) return;
    requestEdit.mutate(
      { projectId, sessionId, toolCallId: toolCall.id, req: { note: editNote.trim() } },
      { onSuccess: () => { setShowEdit(false); setEditNote(""); } }
    );
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-card/60 p-3 transition-opacity",
        isResolved && "opacity-50"
      )}
    >
      {snapshot.artifact_type && (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {snapshot.artifact_type.replace(/_/g, " ")}
        </p>
      )}
      {snapshot.title && (
        <p className="mb-1 text-xs font-semibold text-foreground leading-snug">
          {snapshot.title}
        </p>
      )}
      {snapshot.body && (
        <p className="mb-3 text-xs text-muted-foreground leading-relaxed line-clamp-4">
          {snapshot.body}
        </p>
      )}

      {isResolved ? (
        <p className="text-[10px] font-medium text-muted-foreground capitalize">
          {toolCall.status}
        </p>
      ) : (
        <div className="space-y-2">
          {!showEdit ? (
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={handleApprove}
                disabled={isBusy}
              >
                {approve.isPending ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                ) : (
                  <ThumbsUp className="size-3" aria-hidden />
                )}
                Duyệt
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={handleReject}
                disabled={isBusy}
              >
                {reject.isPending ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                ) : (
                  <ThumbsDown className="size-3" aria-hidden />
                )}
                Từ chối
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-xs text-muted-foreground"
                onClick={() => setShowEdit(true)}
                disabled={isBusy}
              >
                Chỉnh sửa
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Ghi chú chỉnh sửa cho agent…"
                aria-label="Yêu cầu agent chỉnh sửa đề xuất"
                maxLength={MAX_AGENT_INPUT_LENGTH}
                rows={3}
                className="min-h-0 resize-none text-xs"
                disabled={requestEdit.isPending}
                autoFocus
              />
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="h-7 flex-1 gap-1.5 text-xs"
                  onClick={handleRequestEdit}
                  disabled={!editNote.trim() || requestEdit.isPending}
                >
                  {requestEdit.isPending ? (
                    <Loader2 className="size-3 animate-spin" aria-hidden />
                  ) : (
                    <Send className="size-3" aria-hidden />
                  )}
                  Gửi yêu cầu
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-xs"
                  onClick={() => { setShowEdit(false); setEditNote(""); }}
                  disabled={requestEdit.isPending}
                >
                  Huỷ
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProposalsView({
  projectId,
  sessionId,
}: {
  projectId: string;
  sessionId: string;
}) {
  const {
    data: toolCalls = [],
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useAgentSessionToolCalls(projectId, sessionId);

  const proposed = toolCalls.filter((t) => t.status === "proposed");
  const resolved = toolCalls.filter((t) => t.status !== "proposed");

  if (isPending) {
    return (
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
        <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-8 text-center">
        <p className="text-pretty text-xs text-destructive">
          {getApiErrorMessage(error, "Không tải được danh sách đề xuất")}
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
          Tải lại
        </Button>
      </div>
    );
  }

  if (!toolCalls.length) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-center">
        <p className="text-xs text-muted-foreground">Không có đề xuất nào.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-3">
      {proposed.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Chờ duyệt ({proposed.length})</SectionLabel>
          <p className="text-pretty text-[11px] leading-relaxed text-muted-foreground">
            Agent tiếp tục sau khi toàn bộ đề xuất trong batch được xử lý.
          </p>
          {proposed.map((tc) => (
            <ProposalCard
              key={tc.id}
              toolCall={tc}
              projectId={projectId}
              sessionId={sessionId}
            />
          ))}
        </div>
      )}
      {resolved.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Đã xử lý ({resolved.length})</SectionLabel>
          {resolved.map((tc) => (
            <ProposalCard
              key={tc.id}
              toolCall={tc}
              projectId={projectId}
              sessionId={sessionId}
            />
          ))}
        </div>
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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
        <CheckCircle2 className="size-6 text-emerald-500" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Phiên hoàn thành</p>
        <p className="text-pretty text-xs text-muted-foreground">
          Phiên đã kết thúc. Danh sách artifact đã được đồng bộ để bạn review.
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onReset} className="gap-2 text-xs">
        <RefreshCw className="size-3.5" aria-hidden />
        Phiên mới
      </Button>
    </div>
  );
}

function SessionFailed({
  projectId,
  sessionId,
  onReset,
}: {
  projectId: string;
  sessionId: string;
  onReset: () => void;
}) {
  const { data: messages = [] } = useAgentSessionMessages(projectId, sessionId);
  const lastAgentMsg = [...messages].reverse().find((m) => m.role === "agent");

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="size-5 text-destructive" aria-hidden />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">Phiên thất bại</p>
          <p className="text-xs text-muted-foreground">
            Agent gặp lỗi. Kiểm tra LLM Settings hoặc thử lại.
          </p>
        </div>
      </div>

      {lastAgentMsg && (
        <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Thông báo từ agent
          </p>
          <p className="text-xs leading-relaxed text-foreground/80">
            {lastAgentMsg.content}
          </p>
        </div>
      )}

      <Button size="sm" variant="outline" onClick={onReset} className="w-full gap-2 text-xs">
        <RefreshCw className="size-3.5" aria-hidden />
        Thử lại
      </Button>
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
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [missingContext, setMissingContext] = useState<string[]>([]);
  const [startError, setStartError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const sessionStorageKey = projectId
    ? `agent-session:${projectId}:${artifactType}`
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

  const {
    data: session,
    isPending: isSessionPending,
    isError: isSessionError,
    error: sessionError,
    isFetching: isSessionFetching,
    refetch: refetchSession,
  } = useAgentSession(projectId, sessionId);

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
        "Phiên agent không còn tồn tại hoặc bạn không còn quyền truy cập. Bạn có thể bắt đầu phiên mới."
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
        setSessionNotice("Đã mở lại phiên agent đang hoạt động.");
        setSessionId(conflictId);
        return;
      }
      setStartError(getApiErrorMessage(error, "Không thể tạo phiên agent"));
    },
  });

  const deleteSession = useDeleteAgentSession({
    onSuccess: () => {
      setCancelDialogOpen(false);
      setSessionId(null);
      setMissingContext([]);
      setSessionNotice("Phiên agent đã được huỷ.");
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
        step_key: agentStepKey(artifactType),
        workflow_area: "analysis",
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
        session.interruptType !== "ask_human"
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
  const interruptType = session?.interruptType ?? null;
  const restoredMissingContext = formatMissingContext(
    session?.missingContext ?? null
  );
  const visibleMissingContext =
    restoredMissingContext.length > 0
      ? restoredMissingContext
      : missingContext;

  const isCreating = createSession.isPending;
  const isDeleting = deleteSession.isPending;

  return (
    <>
      <aside
        className="flex h-full min-h-0 w-96 shrink-0 flex-col overflow-hidden border-l border-border/60 bg-muted/20"
        aria-label="AI agent session"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-2.5 border-b border-border/60 px-3.5 py-3">
          <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Bot className="size-3.5 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">AI Assistant</p>
            <p className="truncate text-[10px] text-muted-foreground capitalize">
              {artifactType.replace(/_/g, " ")}
            </p>
          </div>
          {session && status !== "completed" && status !== "failed" && (
            <button
              type="button"
              onClick={() => setCancelDialogOpen(true)}
              disabled={isDeleting}
              title="Huỷ phiên"
              aria-label="Huỷ phiên agent"
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-3.5" aria-hidden />
              )}
            </button>
          )}
        </div>

        {/* Missing context warning */}
        {visibleMissingContext.length > 0 && (
          <div className="shrink-0 px-3 pt-3">
            <MissingContextBanner items={visibleMissingContext} />
          </div>
        )}

        {/* Body */}
        {!sessionId || isMissingSession ? (
          <SessionEmpty
            onStart={handleStart}
            isLoading={isCreating}
            message={
              startError ??
              sessionNotice ??
              (isMissingSession
                ? "Phiên agent không còn tồn tại hoặc bạn không còn quyền truy cập. Bạn có thể bắt đầu phiên mới."
                : null)
            }
          />
        ) : isSessionError ? (
          <SessionError
            message={
              sessionErrorCode === 503
                ? "Agent service chưa sẵn sàng. Hãy đợi một chút rồi thử lại."
                : getApiErrorMessage(
                    sessionError,
                    "Không thể tải trạng thái phiên agent"
                  )
            }
            onRetry={() => void refetchSession()}
            onReset={handleReset}
            isRetrying={isSessionFetching}
          />
        ) : isCreating || isSessionPending || status === null ? (
          <SessionActive
            onCancel={() => setCancelDialogOpen(true)}
            isCancelling={isDeleting}
          />
        ) : status === "active" ? (
          <SessionActive
            onCancel={() => setCancelDialogOpen(true)}
            isCancelling={isDeleting}
          />
        ) : status === "waiting_for_human" &&
          interruptType === "ask_human" ? (
          <ChatView
            projectId={projectId!}
            sessionId={sessionId}
            onSend={handleSendMessage}
            isSending={sendMessage.isPending}
          />
        ) : status === "waiting_for_human" &&
          interruptType === "propose_artifacts" ? (
          <ProposalsView projectId={projectId!} sessionId={sessionId} />
        ) : status === "completed" ? (
          <SessionDone onReset={handleReset} />
        ) : status === "failed" ? (
          <SessionFailed
            projectId={projectId!}
            sessionId={sessionId}
            onReset={handleReset}
          />
        ) : (
          <SessionActive
            onCancel={() => setCancelDialogOpen(true)}
            isCancelling={isDeleting}
          />
        )}
      </aside>
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Huỷ phiên agent?</AlertDialogTitle>
            <AlertDialogDescription>
              Phiên hiện tại và tiến trình đang chạy sẽ bị xoá. Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Giữ phiên
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
              Huỷ phiên
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
