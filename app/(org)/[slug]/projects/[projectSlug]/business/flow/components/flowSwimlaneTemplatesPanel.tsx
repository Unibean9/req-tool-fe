"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronLeft,
  Copy,
  LayoutTemplate,
  Mail,
  RefreshCw,
  Server,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectFlowTemplates } from "@/hooks/useFlow";
import { getApiErrorMessage } from "@/lib/api/getApiErrorMessage";
import type {
  ProjectFlowTemplate,
  ProjectFlowTemplateActor,
} from "@/lib/api/services/fetchFlow";
import { cn } from "@/lib/utils";

const PANEL_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

const PANEL_WIDTH_CLASS =
  "w-80 max-w-[min(20rem,calc(100%-0.5rem))] sm:w-96 sm:max-w-[min(24rem,calc(100%-0.5rem))]";

type ActorTone = {
  chip: string;
  stepBg: string;
  stepText: string;
  icon: LucideIcon;
};

const ACTOR_TONE_FALLBACKS: ActorTone[] = [
  {
    chip: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    stepBg: "bg-emerald-600",
    stepText: "text-emerald-600 dark:text-emerald-400",
    icon: UserRound,
  },
  {
    chip: "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    stepBg: "bg-sky-600",
    stepText: "text-sky-600 dark:text-sky-400",
    icon: UserRound,
  },
  {
    chip: "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300",
    stepBg: "bg-amber-600",
    stepText: "text-amber-600 dark:text-amber-400",
    icon: Server,
  },
  {
    chip: "border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    stepBg: "bg-violet-600",
    stepText: "text-violet-600 dark:text-violet-400",
    icon: Mail,
  },
];

const ACTOR_TONE_RULES: { test: RegExp; tone: ActorTone }[] = [
  {
    test: /lectur|giảng|teacher|gv/i,
    tone: ACTOR_TONE_FALLBACKS[0]!,
  },
  {
    test: /student|sinh viên|học sinh|sv/i,
    tone: ACTOR_TONE_FALLBACKS[1]!,
  },
  {
    test: /system|handler|hệ thống|service(?!\s*mail)/i,
    tone: ACTOR_TONE_FALLBACKS[2]!,
  },
  {
    test: /email|mail|thư/i,
    tone: ACTOR_TONE_FALLBACKS[3]!,
  },
];

type FlowSwimlaneTemplatesPanelProps = {
  projectId: string;
  flowId: string;
  className?: string;
};

function pickActorTone(name: string, index: number): ActorTone {
  const n = name.trim();
  for (const rule of ACTOR_TONE_RULES) {
    if (rule.test.test(n)) return rule.tone;
  }
  return ACTOR_TONE_FALLBACKS[index % ACTOR_TONE_FALLBACKS.length]!;
}

function actorDisplayName(actor: ProjectFlowTemplateActor): string {
  return actor.name?.trim() || actor.id;
}

function resolveActorLabel(
  template: ProjectFlowTemplate,
  actorRef: string
): string {
  const ref = actorRef.trim();
  if (!ref) return "—";
  const byId = template.actors.find((a) => a.id === ref);
  if (byId) return actorDisplayName(byId);
  const byName = template.actors.find(
    (a) => actorDisplayName(a).toLowerCase() === ref.toLowerCase()
  );
  if (byName) return actorDisplayName(byName);
  return ref;
}

function buildActorToneLookup(template: ProjectFlowTemplate): Map<string, ActorTone> {
  const map = new Map<string, ActorTone>();
  template.actors.forEach((actor, index) => {
    const tone = pickActorTone(actorDisplayName(actor), index);
    map.set(actor.id, tone);
    map.set(actorDisplayName(actor).toLowerCase(), tone);
  });
  return map;
}

function sortedTemplateSteps(template: ProjectFlowTemplate) {
  return [...template.steps].sort((a, b) => a.step - b.step);
}

/** `1. Mô tả bước` — số bước lấy từ field `step` API. */
function formatTemplateStepsCopyText(template: ProjectFlowTemplate): string {
  return sortedTemplateSteps(template)
    .map((s) => `${s.step}. ${s.description.trim() || "—"}`)
    .join("\n");
}

async function copyTemplateSteps(template: ProjectFlowTemplate) {
  const steps = sortedTemplateSteps(template);
  if (steps.length === 0) {
    toast.message("Template chưa có bước để copy");
    return;
  }
  const text = formatTemplateStepsCopyText(template);
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Đã copy template");
  } catch {
    toast.error("Không copy được — thử lại hoặc cấp quyền clipboard");
  }
}

function toneForActorRef(
  template: ProjectFlowTemplate,
  actorRef: string,
  lookup: Map<string, ActorTone>,
  fallbackIndex: number
): { tone: ActorTone; label: string } {
  const label = resolveActorLabel(template, actorRef);
  const byRef = lookup.get(actorRef.trim());
  if (byRef) return { tone: byRef, label };
  const byLabel = lookup.get(label.toLowerCase());
  if (byLabel) return { tone: byLabel, label };
  return {
    tone: pickActorTone(label, fallbackIndex),
    label,
  };
}

function ActorChip({
  name,
  tone,
}: {
  name: string;
  tone: ActorTone;
}) {
  const Icon = tone.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        tone.chip
      )}
    >
      <Icon className="size-3 shrink-0 opacity-80" aria-hidden />
      {name}
    </span>
  );
}

function FlowSwimlaneTemplateRow({
  template,
  defaultOpen,
}: {
  template: ProjectFlowTemplate;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const steps = useMemo(() => sortedTemplateSteps(template), [template]);
  const actorToneLookup = useMemo(
    () => buildActorToneLookup(template),
    [template]
  );

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex w-full items-start gap-1">
        <CollapsibleTrigger
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-2 py-3 text-left",
            "hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
        >
          <div className="flex w-full items-center justify-between gap-2">
            <span className="rounded-md border border-border/70 bg-muted/50 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              {template.code || "—"} · {steps.length} bước
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )}
              aria-hidden
            />
          </div>
          <h3 className="text-left text-base font-bold tracking-tight text-foreground uppercase">
            {template.name || "Template không tên"}
          </h3>
        </CollapsibleTrigger>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="mt-2.5 size-8 shrink-0 text-muted-foreground hover:text-foreground"
          disabled={steps.length === 0}
          aria-label={`Copy template ${template.name || template.code}`}
          onClick={() => void copyTemplateSteps(template)}
        >
          <Copy className="size-3.5" aria-hidden />
        </Button>
      </div>

      <CollapsibleContent>
        <div className="space-y-4 border-t border-border/50 pb-4 pt-3">
          {template.actors.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Actor
              </p>
              <div className="flex flex-wrap gap-1.5">
                {template.actors.map((actor, index) => {
                  const name = actorDisplayName(actor);
                  const tone =
                    actorToneLookup.get(actor.id) ??
                    pickActorTone(name, index);
                  return (
                    <ActorChip key={actor.id} name={name} tone={tone} />
                  );
                })}
              </div>
            </div>
          ) : null}

          {steps.length > 0 ? (
            <ol className="space-y-0">
              {steps.map((step, index) => {
                const { tone, label } = toneForActorRef(
                  template,
                  step.actor,
                  actorToneLookup,
                  index
                );
                const prevLabel =
                  index > 0
                    ? toneForActorRef(
                        template,
                        steps[index - 1]!.actor,
                        actorToneLookup,
                        index - 1
                      ).label
                    : null;
                const showDivider =
                  index > 0 && prevLabel != null && prevLabel !== label;

                return (
                  <li key={`${template.flowId}-${step.step}`}>
                    {showDivider ? (
                      <div
                        className="my-2 border-t border-border/45"
                        aria-hidden
                      />
                    ) : null}
                    <div className="flex gap-3 py-2">
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums text-white",
                          tone.stepBg
                        )}
                        aria-hidden
                      >
                        {step.step}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm leading-snug text-foreground">
                          {step.description}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-xs font-medium",
                            tone.stepText
                          )}
                        >
                          {label}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-xs text-muted-foreground">Chưa có bước mô tả.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function TemplatesPanelSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

/** Panel phải trong React Flow — layout tham chiếu template (màu actor theo bước). */
export function FlowSwimlaneTemplatesPanel({
  projectId,
  flowId,
  className,
}: FlowSwimlaneTemplatesPanelProps) {
  const [panelOpen, setPanelOpen] = useState(true);
  const { data, isPending, isError, error, refetch, isFetching } =
    useProjectFlowTemplates(projectId, flowId);

  const templates = data ?? [];
  const templateCountLabel = isPending
    ? "Đang tải…"
    : `${templates.length} mẫu`;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {panelOpen ? (
        <motion.div
          key="flow-templates-panel-open"
          role="presentation"
          initial={{ x: 28, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 36, opacity: 0 }}
          transition={{
            duration: 0.24,
            ease: PANEL_MOTION_EASE,
          }}
          className={cn(
            "pointer-events-auto absolute inset-y-0 right-0 z-40 flex h-full min-h-0 will-change-transform",
            PANEL_WIDTH_CLASS,
            className
          )}
        >
          <Card
            size="sm"
            className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden rounded-r-none rounded-l-xl border border-border/90 border-r-0 bg-card/95 shadow-xl backdrop-blur-md"
          >
            <CardHeader className="shrink-0 space-y-1 border-b border-border/60 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <LayoutTemplate
                      className="size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    Template flow
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {templateCountLabel}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Đóng danh sách template"
                  onClick={() => setPanelOpen(false)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-2 pb-4">
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                {isPending ? (
                  <TemplatesPanelSkeleton />
                ) : isError ? (
                  <div className="space-y-2 py-4">
                    <p className="text-xs text-destructive">
                      {getApiErrorMessage(error, "Không tải được template.")}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-full gap-1.5"
                      disabled={isFetching}
                      onClick={() => void refetch()}
                    >
                      <RefreshCw
                        className={cn(
                          "size-3.5",
                          isFetching && "animate-spin"
                        )}
                        aria-hidden
                      />
                      Thử lại
                    </Button>
                  </div>
                ) : templates.length === 0 ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    Chưa có template cho flow này.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {templates.map((template, index) => (
                      <FlowSwimlaneTemplateRow
                        key={template.flowId || `${template.code}-${index}`}
                        template={template}
                        defaultOpen={index === 0}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          key="flow-templates-panel-peek"
          role="presentation"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 16, opacity: 0 }}
          transition={{
            duration: 0.2,
            ease: PANEL_MOTION_EASE,
          }}
          className={cn(
            "pointer-events-auto absolute top-1/2 right-0 z-40 -translate-y-1/2 will-change-transform",
            className
          )}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-11 w-10 rounded-r-none rounded-l-lg border border-border/90 border-r-0 bg-card/95 shadow-lg backdrop-blur-md"
            aria-label="Mở danh sách template flow"
            onClick={() => setPanelOpen(true)}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
