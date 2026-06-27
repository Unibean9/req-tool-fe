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
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  useLlmProviderConfigList,
  useCreateLlmProviderConfig,
  useUpdateLlmProviderConfig,
  useDeleteLlmProviderConfig,
  useHealthCheckLlmProviderConfig,
  type LLMProviderType,
  type LLMProviderConfig,
  type LLMProviderConfigStatus,
} from "@/hooks/useLlmProviderConfig";

// ─── Constants ───────────────────────────────────────────────────────────────

const PROVIDERS: { value: LLMProviderType; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "bedrock", label: "AWS Bedrock" },
];

const HEALTH_CHECK_COOLDOWN_S = 30;

const MODEL_PLACEHOLDER: Record<LLMProviderType, { model: string; strong: string }> = {
  openai: { model: "gpt-4.1-mini", strong: "gpt-4.1" },
  anthropic: { model: "claude-3-5-haiku-latest", strong: "claude-3-5-sonnet-latest" },
  google: { model: "gemini-2.0-flash", strong: "gemini-2.0-pro" },
  bedrock: { model: "anthropic.claude-3-haiku", strong: "anthropic.claude-3-5-sonnet" },
};

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
      setTimeout(() => {
        setRemaining(0);
      }, 0);
      return;
    }
    const last = new Date(lastCheckedAt).getTime();
    const elapsed = Math.floor((Date.now() - last) / 1000);
    const rem = Math.max(0, HEALTH_CHECK_COOLDOWN_S - elapsed);
    setTimeout(() => {
      setRemaining(rem);
    }, 0);
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

// ─── Create form ─────────────────────────────────────────────────────────────

function CreateForm({
  onSaved,
}: {
  onSaved?: () => void;
}) {
  const [providerType, setProviderType] = useState<LLMProviderType>("openai");
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [region, setRegion] = useState("");
  const [modelName, setModelName] = useState("");
  const [strongModelName, setStrongModelName] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const createMutation = useCreateLlmProviderConfig({ onSuccess: () => onSaved?.() });
  const isBedrock = providerType === "bedrock";
  const isSaving = createMutation.isPending;
  const canSave = apiKey.trim().length > 0 && !isSaving;
  const ph = MODEL_PLACEHOLDER[providerType];

  function handleSave() {
    if (!canSave) return;
    createMutation.mutate({
      provider_type: providerType,
      api_key: apiKey.trim(),
      model_name: modelName.trim() || undefined,
      strong_model_name: strongModelName.trim() || undefined,
      ...(isBedrock
        ? { secret_key: secretKey.trim() || null, region: region.trim() || null }
        : { secret_key: null, region: null }),
    });
  }

  return (
    <div className="grid gap-4">
      {/* Provider selector */}
      <div className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Provider</span>
        <div className="grid grid-cols-4 gap-1.5">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProviderType(p.value)}
              className={cn(
                "rounded-lg border px-2 py-2.5 text-center text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/45",
                providerType === p.value
                  ? "border-primary/50 bg-primary/8 text-foreground"
                  : "border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div className="grid gap-1.5">
        <label htmlFor="create-api-key" className="text-sm font-medium text-foreground">
          API Key <span className="text-destructive">*</span>
        </label>
        <PasswordInput
          id="create-api-key"
          value={apiKey}
          onChange={setApiKey}
          show={showApiKey}
          onToggleShow={() => setShowApiKey((v) => !v)}
          placeholder={
            providerType === "openai"
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

      {/* Bedrock-specific: Secret Key + Region */}
      <div
        className={cn(
          "grid gap-4 overflow-hidden transition-all duration-300 ease-in-out",
          isBedrock ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="grid gap-1.5">
          <label htmlFor="create-secret-key" className="text-sm font-medium text-foreground">
             Secret Key
          </label>
          <PasswordInput
            id="create-secret-key"
            value={secretKey}
            onChange={setSecretKey}
            show={showSecretKey}
            onToggleShow={() => setShowSecretKey((v) => !v)}
            placeholder="AWS secret access key"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="create-region" className="text-sm font-medium text-foreground">
            Region
          </label>
          <Input
            id="create-region"
            type="text"
            placeholder="e.g. us-east-1"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            maxLength={64}
          />
        </div>
      </div>

      {/* Model Names */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="create-model-name" className="text-sm font-medium text-foreground">
            Model Name
          </label>
          <Input
            id="create-model-name"
            type="text"
            placeholder={ph.model}
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            maxLength={255}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="create-strong-model-name" className="text-sm font-medium text-foreground">
          Judge Model Name (Optional)
          </label>
          <Input
            id="create-strong-model-name"
            type="text"
            placeholder={ph.strong}
            value={strongModelName}
            onChange={(e) => setStrongModelName(e.target.value)}
            maxLength={255}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        {isSaving && <Loader2 className="size-4 animate-spin" />}
        {isSaving ? "Saving…" : "Save Key"}
      </Button>
    </div>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

function EditForm({ config }: { config: LLMProviderConfig }) {
  const [region, setRegion] = useState(config.region ?? "");
  const [modelName, setModelName] = useState(config.modelName ?? "");
  const [strongModelName, setStrongModelName] = useState(config.strongModelName ?? "");

  const initialRegion = config.region ?? "";
  const initialModelName = config.modelName ?? "";
  const initialStrongModelName = config.strongModelName ?? "";

  const isDirty =
    region !== initialRegion ||
    modelName !== initialModelName ||
    strongModelName !== initialStrongModelName;

  const updateMutation = useUpdateLlmProviderConfig();
  const cooldown = useCooldown(config.lastCheckedAt);
  const healthCheckMutation = useHealthCheckLlmProviderConfig();
  const deleteMutation = useDeleteLlmProviderConfig();

  const isUpdating = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isTesting = healthCheckMutation.isPending;
  const isWorking = isUpdating || isDeleting;

  const ph = MODEL_PLACEHOLDER[config.providerType];
  const isBedrock = config.providerType === "bedrock";
  const providerLabel = PROVIDERS.find((p) => p.value === config.providerType)?.label ?? "";

  function handleUpdate() {
    if (!isDirty || isWorking) return;
    updateMutation.mutate({
      configId: config.id,
      body: {
        region: region.trim() || null,
        model_name: modelName.trim() || null,
        strong_model_name: strongModelName.trim() || null,
      },
    });
  }

  function handleHealthCheck() {
    if (cooldown > 0 || isTesting) return;
    healthCheckMutation.mutate(config.id);
  }

  return (
    <div className="grid gap-4">
      {/* Status card */}
      <div className="overflow-hidden rounded-lg border border-border/70 bg-muted/30">
        <div className="space-y-1.5 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">
                {providerLabel}
              </span>
              <StatusBadge status={config.status} />
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
          {config.lastCheckError ? (
            <p className="truncate text-xs text-destructive">{config.lastCheckError}</p>
          ) : config.lastCheckedAt ? (
            <p className="text-xs text-muted-foreground">
              Last verified:{" "}
              {new Date(config.lastCheckedAt).toLocaleString("vi-VN", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not verified yet — click &quot;Test Connection&quot; to validate.
            </p>
          )}
        </div>
      </div>

      {/* Credential summary (read-only) */}
      <div className="grid gap-1.5">
        <span className="text-sm font-medium text-foreground">Credentials</span>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <Key className="size-3 text-muted-foreground" />
            API key {config.apiKeySet ? "●●●●●●●●" : "not set"}
          </Badge>
          {isBedrock && (
            <Badge variant="outline" className="gap-1.5 font-mono text-xs">
              <Key className="size-3 text-muted-foreground" />
              Secret key {config.secretKeySet ? "●●●●●●●●" : "not set"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          To replace the API key or switch providers, remove this config and add a new one.
        </p>
      </div>

      <Separator />

      {/* Model settings (PATCH) */}
      <div className="grid gap-4">
        <span className="text-sm font-medium text-foreground">Model Settings</span>

        <div className="grid gap-1.5">
          <label htmlFor="edit-region" className="text-sm font-medium text-foreground">
            Region
          </label>
          <Input
            id="edit-region"
            type="text"
            placeholder="e.g. us-east-1"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            maxLength={64}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="edit-model-name" className="text-sm font-medium text-foreground">
              Model Name
            </label>
            <Input
              id="edit-model-name"
              type="text"
              placeholder={ph.model}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="edit-strong-model-name" className="text-sm font-medium text-foreground">
              Judge Model Name (Optional)
            </label>
            <Input
              id="edit-strong-model-name"
              type="text"
              placeholder={ph.strong}
              value={strongModelName}
              onChange={(e) => setStrongModelName(e.target.value)}
              maxLength={255}
            />
          </div>
        </div>
      </div>

      {/* Edit footer actions */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={isWorking}
          onClick={() => deleteMutation.mutate(config.id)}
        >
          {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {isDeleting ? "Removing…" : "Remove"}
        </Button>
        <Button onClick={handleUpdate} disabled={!isDirty || isWorking}>
          {isUpdating && <Loader2 className="size-4 animate-spin" />}
          {isUpdating ? "Updating…" : "Update Models"}
        </Button>
      </div>
    </div>
  );
}

// ─── Main dialog ─────────────────────────────────────────────────────────────

export type LlmProviderConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LlmProviderConfigDialog({ open, onOpenChange }: LlmProviderConfigDialogProps) {
  const { data: configs, isPending: isLoadingConfig } = useLlmProviderConfigList({
    enabled: open,
  });
  const activeConfig: LLMProviderConfig | null = configs?.[0] ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            Configure your personal API key for AI generation. Keys are encrypted server-side and
            never returned in plain text.
          </DialogDescription>
        </DialogHeader>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="-mx-4 flex-1 overflow-y-auto px-4 scrollbar-none">
          {isLoadingConfig ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : activeConfig ? (
            <EditForm config={activeConfig} />
          ) : (
            <CreateForm onSaved={() => onOpenChange(false)} />
          )}
        </div>

        {/* ── Footer (close only) ─────────────────────────────── */}
        <DialogFooter showCloseButton={false} className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
