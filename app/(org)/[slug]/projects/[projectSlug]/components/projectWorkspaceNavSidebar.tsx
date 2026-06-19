"use client";

import { useState } from "react";
import { KeyRound, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LlmProviderConfigDialog } from "@/components/shared/LlmProviderConfigDialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserMe } from "@/hooks/useUser";
import { cn } from "@/lib/utils";

import { useOrgWorkspace } from "../../../orgWorkspaceContext";
import {
  useProjectWorkspaceMode,
  type WorkspaceMode,
} from "./projectWorkspaceModeContext";
import { DeliverablesSidebarContent } from "../(deliverables)/components/DeliverablesSidebarContent";

// ─── Constants ────────────────────────────────────────────────────────────────

const WORKSPACE_MODES: { value: WorkspaceMode; label: string }[] = [
  { value: "deliverables", label: "Deliverables" },
  { value: "artifact-link", label: "Artifact Link" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nameToInitials(fullName: string | undefined): string {
  const name = (fullName ?? "").trim();
  if (!name) return "";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function userInitials(
  email: string | undefined,
  fullName: string | undefined
): string {
  const fromName = nameToInitials(fullName);
  if (fromName) return fromName;
  const local = (email ?? "").split("@")[0]?.trim();
  if (local && local.length >= 2) return local.slice(0, 2).toUpperCase();
  if (local) return local[0]!.toUpperCase();
  return "?";
}

// ─── Component ────────────────────────────────────────────────────────────────

type ProjectWorkspaceNavSidebarProps = {
  orgSlug: string;
  projectSlug: string;
  projectId: string | null;
  projectsLoaded: boolean;
  className?: string;
};

export function ProjectWorkspaceNavSidebar({
  orgSlug,
  projectSlug,
  className,
}: ProjectWorkspaceNavSidebarProps) {
  const { orgFromList } = useOrgWorkspace();
  const { mode, setMode } = useProjectWorkspaceMode();
  const [llmConfigOpen, setLlmConfigOpen] = useState(false);
  const { user, logout, isLoggingOut } = useAuth();
  const { data: profile, isPending: isProfilePending } = useUserMe();

  const email = profile?.email ?? user?.email;
  const displayName =
    profile?.fullName?.trim() || user?.userNname?.trim() || undefined;
  const initials = userInitials(email, profile?.fullName ?? displayName);
  const avatarUrl = profile?.githubAvatarUrl?.trim() || null;
  const avatarAlt = displayName
    ? `Avatar — ${displayName}`
    : email
      ? `Avatar — ${email}`
      : "Account avatar";

  return (
    <>
      <LlmProviderConfigDialog open={llmConfigOpen} onOpenChange={setLlmConfigOpen} />
      <aside
        className={cn(
          "flex h-full min-h-0 w-70 shrink-0 flex-col border-r border-border/60 bg-muted/20",
          className
        )}
        aria-label="Project navigation"
      >
        <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-2 py-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {/* Mode switcher — always visible */}
          <div className="shrink-0">
            <div className="flex rounded-lg bg-muted/40 p-0.5">
              {WORKSPACE_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={cn(
                    "flex-1 truncate rounded-md px-1.5 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/45",
                    mode === m.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "deliverables" && (
            <DeliverablesSidebarContent orgSlug={orgSlug} projectSlug={projectSlug} />
          )}
        </nav>

        <div className="shrink-0 border-t border-border/60 px-2 pt-2 pb-1">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border border-border/50 bg-card/50 px-2 py-2 outline-none transition-colors hover:bg-muted/60",
                "focus-visible:ring-2 focus-visible:ring-ring/45 data-popup-open:bg-muted/60"
              )}
            >
              <Avatar className="size-9 shrink-0 border border-border/60">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={avatarAlt} />
                ) : null}
                <AvatarFallback
                  className={cn(
                    "text-xs font-bold",
                    isProfilePending && "animate-pulse"
                  )}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-foreground">
                  {displayName || email || "Account"}
                </p>
                {orgFromList ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {orgFromList.name}
                  </p>
                ) : email ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {email}
                  </p>
                ) : null}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <span className="block truncate text-sm font-medium">
                    {displayName || "Account"}
                  </span>
                  {email ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {email}
                    </span>
                  ) : null}
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLlmConfigOpen(true)}>
                <KeyRound className="size-4" aria-hidden />
                LLM Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                disabled={isLoggingOut}
                onClick={() => void logout()}
              >
                <LogOut className="size-4" aria-hidden />
                {isLoggingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}
