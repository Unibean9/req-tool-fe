"use client";

import { useCallback, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSendAgentMessage } from "@/hooks/useAgentSession";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import type { ArtifactType } from "@/lib/api/services/fetchArtifact";
import { cn } from "@/lib/utils";

const INITIAL_ARTIFACT_PROMPTS: Record<ArtifactType, string> = {
  research_output:
    "Hãy tổng hợp và cấu trúc các kết quả nghiên cứu quan trọng cho dự án này.",
  intent:
    "Hãy giúp tôi xác định intent tổng thể và giá trị cốt lõi mà dự án này cần tạo ra.",
  problem:
    "Hãy phân tích và làm rõ những vấn đề chính mà dự án này cần giải quyết.",
  goal:
    "Hãy xây dựng các mục tiêu cụ thể, đo lường được và phù hợp với dự án này.",
  stakeholder:
    "Hãy xác định các stakeholder chính, vai trò, nhu cầu và mức độ ảnh hưởng của họ.",
  capability:
    "Hãy xác định các năng lực nghiệp vụ cốt lõi mà hệ thống cần hỗ trợ.",
  domain_entity:
    "Hãy khám phá các domain entity chính, thuộc tính và mối quan hệ giữa chúng.",
  business_rule:
    "Hãy xác định và cấu trúc các business rule quan trọng của dự án.",
  constraint:
    "Hãy phân tích các ràng buộc nghiệp vụ, kỹ thuật và vận hành của dự án.",
  assumption:
    "Hãy xác định các giả định đang được sử dụng và những điểm cần kiểm chứng.",
  risk:
    "Hãy phân tích các rủi ro chính, tác động, khả năng xảy ra và hướng giảm thiểu.",
  open_question:
    "Hãy xác định những câu hỏi còn bỏ ngỏ cần được làm rõ trước khi triển khai.",
  functional_requirement:
    "Hãy xây dựng các functional requirement rõ ràng và có thể kiểm chứng cho dự án.",
  non_functional_requirement:
    "Hãy xác định các non-functional requirement quan trọng và tiêu chí đo lường phù hợp.",
  use_case:
    "Hãy xây dựng các use case chính, actor, luồng chính và các ngoại lệ cần xử lý.",
  epic:
    "Hãy nhóm phạm vi dự án thành các epic rõ ràng, có giá trị và dễ ưu tiên.",
  story:
    "Hãy xây dựng các user story rõ ràng, tập trung vào nhu cầu và giá trị người dùng.",
  acceptance_criteria:
    "Hãy xây dựng acceptance criteria cụ thể, kiểm chứng được cho các yêu cầu hiện tại.",
};

function formatArtifactType(artifactType: string): string {
  return artifactType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getInitialArtifactPrompt(artifactType: ArtifactType): string {
  return (
    INITIAL_ARTIFACT_PROMPTS[artifactType] ??
    `Hãy giúp tôi phân tích và xây dựng ${formatArtifactType(artifactType)} cho dự án này.`
  );
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
  artifactType,
  prompt,
  error,
  isSending,
  onRetry,
}: {
  artifactType: ArtifactType;
  prompt: string;
  error: string | null;
  isSending: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
      <div className="border-b border-border/60 pb-4">
        <p className="text-balance font-heading text-base font-semibold text-foreground">
          Starting {formatArtifactType(artifactType)}
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
