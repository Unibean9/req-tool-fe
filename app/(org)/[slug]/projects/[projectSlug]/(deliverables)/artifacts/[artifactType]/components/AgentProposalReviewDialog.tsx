"use client";

import { useMemo, useState } from "react";
import {
  Braces,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  PencilLine,
  Send,
  ThumbsDown,
  ThumbsUp,
  XCircle,
} from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentAutoResizeTextarea } from "./AgentAutoResizeTextarea";
import {
  useApproveToolCall,
  useRejectToolCall,
  useRequestEditToolCall,
  type AgentToolCall,
  type AgentToolCallStatus,
} from "@/hooks/useAgentSession";
import { MarkdownContent } from "@/components/shared/markdownContent";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import type { DocumentType } from "@/lib/api/services/fetchDocument";
import { cn } from "@/lib/utils";

const MAX_AGENT_INPUT_LENGTH = 8000;
const PRIMARY_CONTENT_KEYS = ["body", "content", "description"] as const;
const SNAPSHOT_LABELS: Record<string, string> = {
  acceptance_criteria: "Acceptance criteria",
  agent_role: "Agent role",
  artifact_type: "Artifact type",
  assumptions: "Assumptions",
  body: "Content",
  business_value: "Business value",
  constraints: "Constraints",
  content: "Content",
  dependencies: "Dependencies",
  description: "Description",
  intent: "Intent",
  notes: "Notes",
  priority: "Priority",
  problem: "Problem",
  rationale: "Proposal rationale",
  scope: "Scope",
  step_key: "Workflow step",
  title: "Title",
  workflow_area: "Workflow area",
};

type ReviewMode = "review" | "request-edit";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function snapshotListItemKey(item: unknown, index: number): string {
  if (isRecord(item)) {
    const stableId = item.id ?? item.key ?? item.slug ?? item.title;
    if (typeof stableId === "string" && stableId.length > 0) {
      return `record-${stableId}`;
    }
    if (typeof stableId === "number") {
      return `record-${stableId}`;
    }
  }
  if (
    typeof item === "string" ||
    typeof item === "number" ||
    typeof item === "boolean"
  ) {
    return `scalar-${index}-${String(item)}`;
  }
  return `index-${index}`;
}

function snapshotString(
  snapshot: Record<string, unknown>,
  key: string
): string | null {
  const value = snapshot[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatSnapshotLabel(key: string): string {
  if (SNAPSHOT_LABELS[key]) return SNAPSHOT_LABELS[key];
  const normalized = key.replace(/[_-]+/g, " ").trim();
  return normalized
    ? `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
    : "Information";
}

function shouldHideSnapshotKey(key: string): boolean {
  const normalized = key.trim().toLowerCase().replace(/-/g, "_");
  return (
    normalized === "id" ||
    normalized === "ids" ||
    normalized.endsWith("_id") ||
    normalized.endsWith("_ids") ||
    normalized === "tool" ||
    normalized === "tool_name" ||
    normalized === "tool_call"
  );
}

function sanitizeSnapshotValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeSnapshotValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !shouldHideSnapshotKey(key))
      .map(([key, nestedValue]) => [
        key,
        sanitizeSnapshotValue(nestedValue),
      ])
  );
}

function formatStatus(status: AgentToolCallStatus): {
  label: string;
  variant: "default" | "outline" | "destructive" | "secondary";
} {
  switch (status) {
    case "proposed":
      return { label: "Pending review", variant: "default" };
    case "approved":
      return { label: "Approved", variant: "secondary" };
    case "rejected":
      return { label: "Rejected", variant: "destructive" };
    case "executed":
      return { label: "Artifact created", variant: "secondary" };
    case "superseded":
      return { label: "Superseded", variant: "outline" };
  }
}

function PrimitiveValue({
  value,
  markdownVariant = "default",
}: {
  value: unknown;
  markdownVariant?: "default" | "document";
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">No data</span>;
  }
  if (typeof value === "boolean") {
    return <span>{value ? "Yes" : "No"}</span>;
  }
  if (typeof value === "string") {
    return (
      <MarkdownContent content={value} variant={markdownVariant} />
    );
  }
  return (
    <span className="whitespace-pre-wrap wrap-break-word">
      {String(value)}
    </span>
  );
}

function SnapshotValue({
  value,
  depth = 0,
  markdownVariant = "default",
}: {
  value: unknown;
  depth?: number;
  markdownVariant?: "default" | "document";
}) {
  if (Array.isArray(value)) {
    if (!value.length) {
      return <span className="text-muted-foreground">Empty list</span>;
    }
    return (
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {value.map((item, index) => (
          <li key={snapshotListItemKey(item, index)} className="pl-1">
            <SnapshotValue
              value={item}
              depth={depth + 1}
              markdownVariant={markdownVariant}
            />
          </li>
        ))}
      </ol>
    );
  }

  if (isRecord(value)) {
    const visibleEntries = Object.entries(value).filter(
      ([key]) => !shouldHideSnapshotKey(key)
    );
    if (!visibleEntries.length) {
      return <span className="text-muted-foreground">No visible details</span>;
    }
    if (depth >= 5) {
      return (
        <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-muted/45 p-3 font-mono text-xs leading-relaxed">
          {JSON.stringify(sanitizeSnapshotValue(value), null, 2)}
        </pre>
      );
    }
    return (
      <dl className="flex flex-col gap-3">
        {visibleEntries.map(([key, nestedValue]) => (
          <div key={key} className="flex flex-col gap-1.5">
            <dt className="text-xs font-semibold text-muted-foreground">
              {formatSnapshotLabel(key)}
            </dt>
            <dd className="text-sm leading-relaxed text-foreground">
              <SnapshotValue
                value={nestedValue}
                depth={depth + 1}
                markdownVariant={markdownVariant}
              />
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <PrimitiveValue value={value} markdownVariant={markdownVariant} />
  );
}

function ProposalDetailField({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <section className="flex flex-col gap-2 border-b border-border/45 pb-5 last:border-b-0 last:pb-0">
      <h3 className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </h3>
      <div className="text-pretty text-sm leading-6 text-foreground/90">
        <SnapshotValue value={value} />
      </div>
    </section>
  );
}

export function AgentProposalReviewDialog({
  toolCall,
  projectId,
  sessionId,
  documentType,
  itemType,
}: {
  toolCall: AgentToolCall;
  projectId: string;
  sessionId: string;
  documentType: DocumentType;
  itemType: string;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ReviewMode>("review");
  const [editNote, setEditNote] = useState("");

  const approve = useApproveToolCall();
  const reject = useRejectToolCall();
  const requestEdit = useRequestEditToolCall();

  const snapshot = toolCall.inputSnapshot;
  const proposalTitle =
    snapshotString(snapshot, "title") ??
    `Proposed ${formatSnapshotLabel(
      snapshotString(snapshot, "artifact_type") ?? itemType
    )}`;
  const artifactLabel =
    snapshotString(snapshot, "artifact_type") ?? itemType;
  const primaryContentKey = PRIMARY_CONTENT_KEYS.find(
    (key) => snapshot[key] !== undefined && snapshot[key] !== null
  );
  const primaryContent = primaryContentKey
    ? snapshot[primaryContentKey]
    : null;
  const detailEntries = useMemo(
    () =>
      Object.entries(snapshot).filter(
        ([key]) =>
          !shouldHideSnapshotKey(key) &&
          key !== "title" &&
          key !== "artifact_type" &&
          key !== primaryContentKey
      ),
    [primaryContentKey, snapshot]
  );
  const status = formatStatus(toolCall.status);
  const isResolved = toolCall.status !== "proposed";
  const isBusy =
    approve.isPending || reject.isPending || requestEdit.isPending;
  const actionError =
    mode === "request-edit"
      ? requestEdit.error
      : approve.error ?? reject.error ?? null;
  const editFieldId = `proposal-edit-${toolCall.id}`;
  const editHelpId = `proposal-edit-help-${toolCall.id}`;
  const editErrorId = `proposal-edit-error-${toolCall.id}`;

  const resetReviewState = () => {
    setMode("review");
    setEditNote("");
    approve.reset();
    reject.reset();
    requestEdit.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetReviewState();
  };

  const closeAfterSuccess = () => {
    setOpen(false);
    resetReviewState();
  };

  const handleApprove = () => {
    approve.mutate(
      {
        projectId,
        sessionId,
        toolCallId: toolCall.id,
        documentType,
        itemType,
      },
      { onSuccess: closeAfterSuccess }
    );
  };

  const handleReject = () => {
    reject.mutate(
      {
        projectId,
        sessionId,
        toolCallId: toolCall.id,
        documentType,
        itemType,
      },
      { onSuccess: closeAfterSuccess }
    );
  };

  const handleRequestEdit = () => {
    const note = editNote.trim();
    if (!note) return;
    requestEdit.mutate(
      {
        projectId,
        sessionId,
        toolCallId: toolCall.id,
        documentType,
        itemType,
        req: { note },
      },
      { onSuccess: closeAfterSuccess }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex w-full flex-col gap-3 rounded-xl border bg-card/60 p-3 text-left outline-none",
          "transition-[transform,border-color,background-color] duration-150 ease-out",
          "hover:border-primary/35 hover:bg-card focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/45",
          "active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
          isResolved && "bg-muted/25"
        )}
        aria-label={`View full proposal: ${proposalTitle}`}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <Badge variant="outline">
            <FileText data-icon="inline-start" aria-hidden />
            <span>{artifactLabel.replace(/_/g, " ")}</span>
          </Badge>
          <Badge variant={status.variant}>{status.label}</Badge>
        </span>

        <span className="flex flex-col gap-1.5">
          <span className="text-pretty break-words text-sm font-semibold leading-snug text-foreground">
            {proposalTitle}
          </span>
          <span className="text-pretty text-xs leading-relaxed text-muted-foreground">
            Open the full review to inspect every proposal detail.
          </span>
        </span>

        <span className="flex w-full items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Ready for review</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
            <Eye aria-hidden />
            View full proposal
          </span>
        </span>
      </button>

      <DialogContent
        className="top-2 h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none -translate-y-0 overflow-hidden rounded-xl sm:top-4 sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)] sm:w-[min(100vw-2rem,72rem)] sm:max-w-[min(100vw-2rem,72rem)]"
        contentClassName="relative flex h-full min-h-0 flex-col overflow-hidden"
        showCloseButton
      >
        <DialogHeader className="shrink-0 gap-3 border-b border-border/70 px-5 py-4 pr-14 text-left sm:px-7 sm:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <FileText data-icon="inline-start" aria-hidden />
              {artifactLabel.replace(/_/g, " ")}
            </Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-balance break-words text-xl font-semibold leading-tight">
              {proposalTitle}
            </DialogTitle>
            <DialogDescription className="text-pretty">
              Review the complete content and supporting details before making
              a decision.
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex w-full flex-col gap-8 px-5 py-6 sm:px-7 sm:py-8">
            {primaryContentKey ? (
              <SnapshotValue
                value={primaryContent}
                markdownVariant="document"
              />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Braces className="size-4 text-primary" aria-hidden />
                  Proposal data
                </div>
                <p className="text-pretty text-sm leading-6 text-muted-foreground">
                  No primary content field was provided. All available details
                  are shown below.
                </p>
              </div>
            )}

            {detailEntries.length ? (
              <section className="flex flex-col gap-5 border-t border-border/45 pt-8">
                <div className="flex flex-col gap-1">
                  <h2 className="text-balance text-sm font-semibold uppercase tracking-[0.12em] text-foreground">
                    Supporting fields
                  </h2>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    Extra metadata supplied alongside the main proposal body.
                  </p>
                </div>
                <div className="flex flex-col gap-5">
                  {detailEntries.map(([key, value]) => (
                    <ProposalDetailField
                      key={key}
                      label={formatSnapshotLabel(key)}
                      value={value}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </ScrollArea>

        <footer className="shrink-0 border-t border-border/70 bg-popover px-5 py-4 sm:px-7">
          {mode === "request-edit" && !isResolved ? (
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel htmlFor={editFieldId}>
                  What should the agent revise?
                </FieldLabel>
                <div className="rounded-2xl border border-border/70 bg-muted/35 shadow-sm focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
                  <AgentAutoResizeTextarea
                    id={editFieldId}
                    value={editNote}
                    onValueChange={setEditNote}
                    onSubmit={handleRequestEdit}
                    placeholder="Explain what is missing, what should change, and what the revised result should achieve…"
                    aria-describedby={
                      actionError
                        ? `${editHelpId} ${editErrorId}`
                        : editHelpId
                    }
                    aria-invalid={Boolean(actionError)}
                    maxLength={MAX_AGENT_INPUT_LENGTH}
                    minHeight={128}
                    maxHeight={320}
                    disabled={requestEdit.isPending}
                    autoFocus
                    className="rounded-none border-0 bg-transparent px-4 pt-3.5 pb-2 text-sm leading-6 shadow-none transition-none focus-visible:border-transparent focus-visible:ring-0"
                  />
                  <div className="flex flex-col gap-3 border-t border-border/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <FieldDescription
                      id={editHelpId}
                      className="tabular-nums"
                    >
                      {editNote.length.toLocaleString()}/
                      {MAX_AGENT_INPUT_LENGTH.toLocaleString()}
                    </FieldDescription>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRequestEdit}
                      disabled={!editNote.trim() || requestEdit.isPending}
                      aria-label={
                        requestEdit.isPending
                          ? "Sending revision request"
                          : "Send revision request"
                      }
                    >
                      {requestEdit.isPending ? (
                        <Loader2
                          data-icon="inline-start"
                          className="animate-spin"
                        />
                      ) : (
                        <Send data-icon="inline-start" />
                      )}
                      Send revision
                    </Button>
                  </div>
                </div>
              </Field>

              {actionError ? (
                <p
                  id={editErrorId}
                  className="text-pretty text-sm text-destructive"
                  role="alert"
                >
                  {getApiErrorMessage(
                    actionError,
                    "Could not send the revision request"
                  )}
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMode("review");
                    setEditNote("");
                  }}
                  disabled={requestEdit.isPending}
                >
                  Back to review
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {actionError ? (
                <p className="text-pretty text-sm text-destructive" role="alert">
                  {getApiErrorMessage(
                    actionError,
                    "Could not process the proposal"
                  )}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {isResolved ? (
                    toolCall.status === "rejected" ? (
                      <XCircle className="size-4 text-destructive" aria-hidden />
                    ) : (
                      <CheckCircle2 className="size-4 text-primary" aria-hidden />
                    )
                  ) : (
                    <FileText className="size-4 text-primary" aria-hidden />
                  )}
                  <span className="text-pretty">
                    {isResolved
                      ? `This proposal is ${status.label.toLowerCase()}.`
                      : "Your decision applies to the proposal currently open."}
                  </span>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <DialogClose render={<Button variant="outline" />}>
                    Close
                  </DialogClose>
                  {!isResolved ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          approve.reset();
                          reject.reset();
                          requestEdit.reset();
                          setMode("request-edit");
                        }}
                        disabled={isBusy}
                      >
                        <PencilLine data-icon="inline-start" />
                        Request revision
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isBusy}
                      >
                        {reject.isPending ? (
                          <Loader2
                            data-icon="inline-start"
                            className="animate-spin"
                          />
                        ) : (
                          <ThumbsDown data-icon="inline-start" />
                        )}
                        Reject
                      </Button>
                      <Button
                        type="button"
                        onClick={handleApprove}
                        disabled={isBusy}
                      >
                        {approve.isPending ? (
                          <Loader2
                            data-icon="inline-start"
                            className="animate-spin"
                          />
                        ) : (
                          <ThumbsUp data-icon="inline-start" />
                        )}
                        Approve proposal
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
