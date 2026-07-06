"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Globe2, Key, Loader2, Trash2, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

type ProviderOptionId = LLMProviderType;

type ProviderOption = {
  value: ProviderOptionId;
  label: string;
  helper: string;
  payloadType: LLMProviderType;
  apiKeyPlaceholder: string;
  model: string;
  strong: string;
};

const PROVIDERS: ProviderOption[] = [
  {
    value: "openai",
    label: "OpenAI",
    helper: "Built-in",
    payloadType: "openai",
    apiKeyPlaceholder: "Enter OpenAI API key",
    model: "gpt-4.1-mini",
    strong: "gpt-4.1",
  },
  {
    value: "anthropic",
    label: "Anthropic",
    helper: "Built-in",
    payloadType: "anthropic",
    apiKeyPlaceholder: "Enter Anthropic API key",
    model: "claude-3-5-haiku-latest",
    strong: "claude-3-5-sonnet-latest",
  },
  {
    value: "google",
    label: "Google",
    helper: "Built-in",
    payloadType: "google",
    apiKeyPlaceholder: "Enter Google API key",
    model: "gemini-2.0-flash",
    strong: "gemini-2.0-pro",
  },
  {
    value: "mistral",
    label: "Mistral",
    helper: "Built-in",
    payloadType: "mistral",
    apiKeyPlaceholder: "Enter Mistral API key",
    model: "mistral-small-latest",
    strong: "mistral-large-latest",
  },
  {
    value: "bedrock",
    label: "AWS Bedrock",
    helper: "Built-in",
    payloadType: "bedrock",
    apiKeyPlaceholder: "Enter AWS access key ID",
    model: "anthropic.claude-3-haiku",
    strong: "anthropic.claude-3-5-sonnet",
  },
  {
    value: "custom",
    label: "Custom",
    helper: "Custom URL",
    payloadType: "custom",
    apiKeyPlaceholder: "Enter provider API key",
    model: "provider/model-or-model-id",
    strong: "optional-strong-model",
  },
];

const HEALTH_CHECK_COOLDOWN_S = 30;

function getProviderOption(value: ProviderOptionId): ProviderOption {
  return PROVIDERS.find((p) => p.value === value) ?? PROVIDERS[0];
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "::1") return true;

  const ipv4 = host.split(".").map((part) => Number(part));
  if (ipv4.length !== 4 || ipv4.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return host.includes(":") && (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:"));
  }

  const [a, b] = ipv4;
  return (
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function getBaseUrlError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Base URL is required.";

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return "Base URL must use HTTPS.";
    if (url.username || url.password) return "Base URL must not include credentials.";
    if (url.search || url.hash) return "Base URL must not include query string or fragment.";
    if (isPrivateOrLocalHost(url.hostname)) return "Base URL cannot point to localhost or a private IP.";
    return null;
  } catch {
    return "Enter a valid HTTPS base URL.";
  }
}

function getDisplayProvider(providerType: LLMProviderType): ProviderOption {
  if (providerType !== "custom") return getProviderOption(providerType);
  return getProviderOption("custom");
}

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
  const [providerType, setProviderType] = useState<ProviderOptionId>("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [baseUrlTouched, setBaseUrlTouched] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [region, setRegion] = useState("");
  const [regionTouched, setRegionTouched] = useState(false);
  const [modelName, setModelName] = useState("");
  const [strongModelName, setStrongModelName] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const createMutation = useCreateLlmProviderConfig({ onSuccess: () => onSaved?.() });
  const provider = getProviderOption(providerType);
  const isCustomProvider = provider.payloadType === "custom";
  const isBedrock = provider.payloadType === "bedrock";
  const baseUrlError = isCustomProvider ? getBaseUrlError(baseUrl) : null;
  const showBaseUrlError = Boolean(baseUrlTouched && baseUrlError);
  const regionError = isBedrock && !region.trim() ? "Region is required." : null;
  const showRegionError = Boolean(regionTouched && regionError);
  const isSaving = createMutation.isPending;
  const canSave =
    apiKey.trim().length > 0 &&
    !isSaving &&
    (!isCustomProvider || (modelName.trim().length > 0 && !baseUrlError)) &&
    (!isBedrock || !regionError);

  function handleProviderChange(nextProviderType: ProviderOptionId) {
    setProviderType(nextProviderType);
    setBaseUrl("");
    setBaseUrlTouched(false);
    setSecretKey("");
    setRegion("");
    setRegionTouched(false);
  }

  function handleSave() {
    if (!canSave) return;
    const trimmedModelName = modelName.trim();
    const trimmedStrongModelName = strongModelName.trim();

    createMutation.mutate({
      provider_type: provider.payloadType,
      api_key: apiKey.trim(),
      model_name: isCustomProvider ? trimmedModelName : trimmedModelName || undefined,
      strong_model_name: trimmedStrongModelName || undefined,
      ...(isCustomProvider ? { base_url: normalizeBaseUrl(baseUrl) } : {}),
      ...(isBedrock
        ? { secret_key: secretKey.trim() || null, region: region.trim() }
        : { secret_key: null, region: null }),
    });
  }

  return (
    <div className="grid gap-4">
      {/* Provider selector */}
      <div className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Provider</span>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handleProviderChange(p.value)}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center rounded-lg border px-2 py-2 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/45",
                providerType === p.value
                  ? "border-primary/50 bg-primary/8 text-foreground"
                  : "border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className="block truncate text-sm font-medium">{p.label}</span>
              <span className="mt-0.5 block truncate text-[11px] font-medium opacity-70">
                {p.helper}
              </span>
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
          placeholder={provider.apiKeyPlaceholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canSave) handleSave();
          }}
        />
      </div>

      {/* Custom-compatible: Base URL */}
      <div
        className={cn(
          "grid gap-1.5 overflow-hidden transition-all duration-300 ease-in-out",
          isCustomProvider ? "max-h-28 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <label htmlFor="create-base-url" className="text-sm font-medium text-foreground">
          Base URL <span className="text-destructive">*</span>
        </label>
        <Input
          id="create-base-url"
          type="url"
          placeholder="https://custom.example/v1"
          value={baseUrl}
          onBlur={() => setBaseUrlTouched(true)}
          onChange={(e) => {
            setBaseUrl(e.target.value);
            setBaseUrlTouched(true);
          }}
          aria-invalid={showBaseUrlError}
          maxLength={512}
        />
        {showBaseUrlError && <p className="text-xs text-destructive">{baseUrlError}</p>}
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
            Region <span className="text-destructive">*</span>
          </label>
          <Input
            id="create-region"
            type="text"
            placeholder="e.g. us-east-1"
            value={region}
            onBlur={() => setRegionTouched(true)}
            onChange={(e) => {
              setRegion(e.target.value);
              setRegionTouched(true);
            }}
            aria-invalid={showRegionError}
            maxLength={64}
          />
          {showRegionError && <p className="text-xs text-destructive">{regionError}</p>}
        </div>
      </div>

      {/* Model Names */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="create-model-name" className="text-sm font-medium text-foreground">
            Model Name {isCustomProvider && <span className="text-destructive">*</span>}
          </label>
          <Input
            id="create-model-name"
            type="text"
            placeholder={provider.model}
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            maxLength={255}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="create-strong-model-name" className="text-sm font-medium text-foreground">
            Judge Model Name
          </label>
          <Input
            id="create-strong-model-name"
            type="text"
            placeholder={provider.strong}
            value={strongModelName}
            onChange={(e) => setStrongModelName(e.target.value)}
            maxLength={255}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        {isSaving && <Loader2 className="size-4 animate-spin" />}
        {isSaving ? "Saving…" : "Save Provider"}
      </Button>
    </div>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

function EditForm({ config }: { config: LLMProviderConfig }) {
  const [baseUrl, setBaseUrl] = useState(config.baseUrl ?? "");
  const [baseUrlTouched, setBaseUrlTouched] = useState(false);
  const [region, setRegion] = useState(config.region ?? "");
  const [regionTouched, setRegionTouched] = useState(false);
  const [modelName, setModelName] = useState(config.modelName ?? "");
  const [strongModelName, setStrongModelName] = useState(config.strongModelName ?? "");

  const initialBaseUrl = config.baseUrl ?? "";
  const initialRegion = config.region ?? "";
  const initialModelName = config.modelName ?? "";
  const initialStrongModelName = config.strongModelName ?? "";
  const isCustomProvider = config.providerType === "custom";
  const isBedrock = config.providerType === "bedrock";
  const baseUrlError = isCustomProvider ? getBaseUrlError(baseUrl) : null;
  const showBaseUrlError = Boolean(baseUrlTouched && baseUrlError);
  const regionError = isBedrock && !region.trim() ? "Region is required." : null;

  const isDirty =
    (isCustomProvider && baseUrl !== initialBaseUrl) ||
    (isBedrock && region !== initialRegion) ||
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
  const showRegionError = Boolean(regionTouched && regionError);
  const canUpdate =
    isDirty &&
    !isWorking &&
    (!isCustomProvider || !baseUrlError) &&
    (!isBedrock || !regionError);

  const provider = getDisplayProvider(config.providerType);
  const providerLabel = provider.label;

  function handleUpdate() {
    if (!canUpdate) return;
    updateMutation.mutate({
      configId: config.id,
      body: {
        ...(isCustomProvider ? { base_url: normalizeBaseUrl(baseUrl) } : {}),
        ...(isBedrock ? { region: region.trim() } : {}),
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
          {config.baseUrl && (
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Globe2 className="size-3 shrink-0" />
              <span className="truncate">{config.baseUrl}</span>
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

        {isCustomProvider && (
          <div className="grid gap-1.5">
            <label htmlFor="edit-base-url" className="text-sm font-medium text-foreground">
              Base URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-base-url"
              type="url"
              placeholder="https://custom.example/v1"
              value={baseUrl}
              onBlur={() => setBaseUrlTouched(true)}
              onChange={(e) => {
                setBaseUrl(e.target.value);
                setBaseUrlTouched(true);
              }}
              aria-invalid={showBaseUrlError}
              maxLength={512}
            />
            <p
              className={cn(
                "text-xs",
                showBaseUrlError ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {showBaseUrlError
                ? baseUrlError
                : "Changing this resets the config to draft until health check passes."}
            </p>
          </div>
        )}

        {isBedrock && (
          <div className="grid gap-1.5">
            <label htmlFor="edit-region" className="text-sm font-medium text-foreground">
              Region <span className="text-destructive">*</span>
            </label>
            <Input
              id="edit-region"
              type="text"
              placeholder="e.g. us-east-1"
              value={region}
              onBlur={() => setRegionTouched(true)}
              onChange={(e) => {
                setRegion(e.target.value);
                setRegionTouched(true);
              }}
              aria-invalid={showRegionError}
              maxLength={64}
            />
            {showRegionError && <p className="text-xs text-destructive">{regionError}</p>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="edit-model-name" className="text-sm font-medium text-foreground">
              Model Name
            </label>
            <Input
              id="edit-model-name"
              type="text"
              placeholder={provider.model}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              maxLength={255}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="edit-strong-model-name" className="text-sm font-medium text-foreground">
              Judge Model Name
            </label>
            <Input
              id="edit-strong-model-name"
              type="text"
              placeholder={provider.strong}
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
        <Button onClick={handleUpdate} disabled={!canUpdate}>
          {isUpdating && <Loader2 className="size-4 animate-spin" />}
          {isUpdating ? "Updating…" : "Update Settings"}
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

      </DialogContent>
    </Dialog>
  );
}
