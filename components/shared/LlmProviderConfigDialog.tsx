"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Key, Loader2, Trash2, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useLlmProviderConfigList,
  useUpsertLlmProviderConfig,
  useDeleteLlmProviderConfig,
  useHealthCheckLlmProviderConfig,
  type LLMProviderType,
  type LLMProviderConfig,
  type LLMProviderConfigStatus,
} from "@/hooks/useLlmProviderConfig";

// ─── Constants ───────────────────────────────────────────────────────────────

const PROVIDERS: { value: LLMProviderType; label: string }[] = [
  { value: "openai", label: "OpenAI (ChatGPT)" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "google", label: "Google Gemini" },
  { value: "bedrock", label: "AWS Bedrock" },
];

const HEALTH_CHECK_COOLDOWN_S = 30;

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: LLMProviderConfigStatus }) {
  if (status === "active") {
    return (
      <Badge className="border-emerald-500/30 bg-emerald-500/12 text-emerald-600 shadow-none dark:bg-emerald-500/18 dark:text-emerald-400">
        Active
      </Badge>
    );
  }
  if (status === "error") {
    return <Badge variant="destructive">Error</Badge>;
  }
  if (status === "draft") {
    return (
      <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-600 shadow-none dark:text-amber-400">
        Draft
      </Badge>
    );
  }
  return <Badge variant="outline">Disabled</Badge>;
}

function useCooldown(lastCheckedAt: string | null): number {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!lastCheckedAt) {
      setRemaining(0);
      return;
    }
    const last = new Date(lastCheckedAt).getTime();
    const elapsed = Math.floor((Date.now() - last) / 1000);
    const rem = Math.max(0, HEALTH_CHECK_COOLDOWN_S - elapsed);
    setRemaining(rem);
    if (rem <= 0) return;

    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [lastCheckedAt]);

  return remaining;
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  show,
  onToggleShow,
  onKeyDown,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  show: boolean;
  onToggleShow: () => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        className="pr-9"
      />
      <button
        type="button"
        onClick={onToggleShow}
        tabIndex={-1}
        className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? "Hide key" : "Show key"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

export type LlmProviderConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LlmProviderConfigDialog({
  open,
  onOpenChange,
}: LlmProviderConfigDialogProps) {
  const { data: configs, isPending: isLoadingConfig } = useLlmProviderConfigList({
    enabled: open,
  });
  const activeConfig: LLMProviderConfig | null = configs?.[0] ?? null;

  const [providerType, setProviderType] = useState<LLMProviderType>("openai");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [region, setRegion] = useState("");
  const [modelName, setModelName] = useState("");
  const [strongModelName, setStrongModelName] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const cooldown = useCooldown(activeConfig?.lastCheckedAt ?? null);

  // Clear sensitive fields when dialog opens
  useEffect(() => {
    if (!open) return;
    setApiKey("");
    setSecretKey("");
    setShowApiKey(false);
    setShowSecretKey(false);
  }, [open]);

  // Sync provider & region from loaded config
  useEffect(() => {
    if (!open || !activeConfig) return;
    setProviderType(activeConfig.providerType);
    setRegion(activeConfig.region ?? "");
    setModelName(activeConfig.modelName ?? "");
    setStrongModelName(activeConfig.strongModelName ?? "");
  }, [open, activeConfig?.id, activeConfig?.providerType]);

  const upsertMutation = useUpsertLlmProviderConfig();
  const deleteMutation = useDeleteLlmProviderConfig();
  const healthCheckMutation = useHealthCheckLlmProviderConfig();

  const isBedrock = providerType === "bedrock";
  const isSaving = upsertMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isTesting = healthCheckMutation.isPending;
  const isWorking = isSaving || isDeleting;

  function handleSave() {
    if (!apiKey.trim()) return;
    upsertMutation.mutate({
      provider_type: providerType,
      api_key: apiKey.trim(),
      model_name: modelName.trim(),
      strong_model_name: strongModelName.trim(),
      ...(isBedrock
        ? { secret_key: secretKey.trim() || null, region: region.trim() || null }
        : { secret_key: null, region: null }),
    });
  }

  function handleHealthCheck() {
    if (!activeConfig || cooldown > 0 || isTesting) return;
    healthCheckMutation.mutate(activeConfig.id);
  }

  const canSave = apiKey.trim().length > 0 && !isWorking;
  const providerLabel =
    PROVIDERS.find((p) => p.value === activeConfig?.providerType)?.label ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
       * contentClassName replaces the inner wrapper so we can build a
       * flex-col layout: header (fixed) + scrollable body + footer (fixed).
       * The footer keeps its -mx-4 -mb-4 negative margins which reference p-4.
       */}
      <DialogContent
        className="sm:max-w-xl"
        contentClassName="relative flex flex-col gap-0 p-4"
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <DialogHeader className="mb-4 pr-6">
          <DialogTitle className="flex items-center gap-2">
            <Key className="size-4 text-muted-foreground" aria-hidden />
            LLM Settings
          </DialogTitle>
          <DialogDescription>
            Configure your personal API key for AI generation. Keys are encrypted server-side and never returned in plain text.
          </DialogDescription>
        </DialogHeader>

        {/* ── Body: fixed height, scrollable ─────────────────── */}
        <div className="-mx-4 flex-1 overflow-y-auto px-4 scrollbar-none">
          <div className="grid gap-4 pb-2">

            {/* Status section — always renders at min-h so loading→loaded never shifts */}
            <div className="min-h-18 overflow-hidden rounded-lg border border-border/70 bg-muted/30">
              {isLoadingConfig ? (
                <div className="flex h-full min-h-18 items-center justify-center">
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : activeConfig ? (
                <div className="space-y-1.5 px-3 py-2.5">
                  {/* Provider name + status badge + test button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {providerLabel}
                      </span>
                      <StatusBadge status={activeConfig.status} />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cooldown > 0 || isTesting}
                      onClick={handleHealthCheck}
                      className="h-7 shrink-0 gap-1.5 px-2.5 text-xs"
                    >
                      {isTesting ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Zap className="size-3" />
                      )}
                      {isTesting
                        ? "Testing…"
                        : cooldown > 0
                        ? `Test (${cooldown}s)`
                        : "Test Connection"}
                    </Button>
                  </div>
                  {/* Sub-line: error or last-verified */}
                  {activeConfig.lastCheckError ? (
                    <p className="truncate text-xs text-destructive">
                      {activeConfig.lastCheckError}
                    </p>
                  ) : activeConfig.lastCheckedAt ? (
                    <p className="text-xs text-muted-foreground">
                      Last verified:{" "}
                      {new Date(activeConfig.lastCheckedAt).toLocaleString("vi-VN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Not verified yet — click "Test Connection" to validate.
                    </p>
                  )}
                </div>
              ) : (
                /* No config yet — placeholder keeps the area visible */
                <div className="flex min-h-18 items-center justify-center px-4">
                  <p className="text-xs text-muted-foreground">
                    No LLM provider configured yet.
                  </p>
                </div>
              )}
            </div>

            {/* Provider selector */}
            <div className="grid gap-2">
              <span className="text-sm font-medium text-foreground">Provider</span>
              <div className="flex gap-1.5">
                {PROVIDERS.map((p) => {
                  const isActive = activeConfig?.providerType === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setProviderType(p.value)}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-2.5 text-center text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/45",
                        providerType === p.value
                          ? "border-primary/50 bg-primary/8 text-foreground"
                          : "border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <span className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap">
                        {p.label}
                        {isActive && (
                          <span className="relative flex size-2 shrink-0">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* API Key */}
            <div className="grid gap-1.5">
              <label htmlFor="llm-api-key" className="text-sm font-medium text-foreground">
                API Key
              </label>
              <PasswordInput
                id="llm-api-key"
                value={apiKey}
                onChange={setApiKey}
                show={showApiKey}
                onToggleShow={() => setShowApiKey((v) => !v)}
                placeholder={
                  activeConfig?.apiKeySet
                    ? "Enter new key to replace existing"
                    : providerType === "openai"
                    ? "sk-..."
                    : providerType === "anthropic"
                    ? "sk-ant-..."
                    : "Your API key"
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canSave) handleSave();
                }}
              />
            </div>

            {/* Model names */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label
                  htmlFor="llm-model-name"
                  className="text-sm font-medium text-foreground"
                >
                  Model Name
                </label>
                <Input
                  id="llm-model-name"
                  type="text"
                  placeholder={
                    providerType === "openai"
                      ? "gpt-4.1-mini"
                      : providerType === "anthropic"
                      ? "claude-3-5-haiku-latest"
                      : providerType === "google"
                      ? "gemini-2.0-flash"
                      : "anthropic.claude-3-haiku"
                  }
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  maxLength={128}
                />
              </div>
              <div className="grid gap-1.5">
                <label
                  htmlFor="llm-strong-model-name"
                  className="text-sm font-medium text-foreground"
                >
                  Strong Model Name
                </label>
                <Input
                  id="llm-strong-model-name"
                  type="text"
                  placeholder={
                    providerType === "openai"
                      ? "gpt-4.1"
                      : providerType === "anthropic"
                      ? "claude-3-5-sonnet-latest"
                      : providerType === "google"
                      ? "gemini-2.0-pro"
                      : "anthropic.claude-3-5-sonnet"
                  }
                  value={strongModelName}
                  onChange={(e) => setStrongModelName(e.target.value)}
                  maxLength={128}
                />
              </div>
            </div>

            {/*
             * Bedrock-specific fields — always rendered in the DOM.
             * max-h + opacity transition prevents the dialog from jumping when
             * the user switches to/from AWS Bedrock.
             */}
            <div
              className={cn(
                "grid gap-4 overflow-hidden transition-all duration-300 ease-in-out",
                isBedrock ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="grid gap-1.5">
                <label
                  htmlFor="llm-secret-key"
                  className="text-sm font-medium text-foreground"
                >
                  AWS Secret Access Key
                </label>
                <PasswordInput
                  id="llm-secret-key"
                  value={secretKey}
                  onChange={setSecretKey}
                  show={showSecretKey}
                  onToggleShow={() => setShowSecretKey((v) => !v)}
                  placeholder={
                    activeConfig?.secretKeySet
                      ? "Enter new secret key to replace"
                      : "AWS secret access key"
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <label
                  htmlFor="llm-region"
                  className="text-sm font-medium text-foreground"
                >
                  Region
                </label>
                <Input
                  id="llm-region"
                  type="text"
                  placeholder="e.g. us-east-1"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  maxLength={64}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <DialogFooter showCloseButton={false} className="mt-0 gap-2 sm:justify-between">
          <div>
            {activeConfig && (
              <Button
                variant="destructive"
                size="sm"
                disabled={isWorking}
                onClick={() => deleteMutation.mutate(activeConfig.id)}
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
                {isDeleting ? "Removing…" : "Remove"}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isWorking}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {isSaving && <Loader2 className="size-4 animate-spin" />}
              {isSaving ? "Saving…" : activeConfig ? "Update Key" : "Save Key"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
