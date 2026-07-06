import { FileText } from "lucide-react";

type ArtifactPageHeaderProps = {
  title: string;
  description?: string | null;
  status: string;
};

export function ArtifactPageHeader({
  title,
  description,
  status,
}: ArtifactPageHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border/60 pb-5">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-brand-mint"
          aria-hidden
        >
          <FileText className="size-[1.125rem]" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium text-primary">
            Artifact type
          </p>
          <h1 className="mt-0.5 text-balance font-heading text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {status}
          </p>
        </div>
      </div>
    </header>
  );
}
