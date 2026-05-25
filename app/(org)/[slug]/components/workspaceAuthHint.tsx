import { cn } from "@/lib/utils";

/**
 * Short hint shown after sign-in — shared across auth / org workspace.
 */
export function WorkspaceAuthHint({ className }: { className?: string }) {
  return (
    <p className={cn("text-muted-foreground text-xs leading-relaxed", className)}>
      After signing in, select an organization to enter its workspace (Projects, Members).
    </p>
  );
}
