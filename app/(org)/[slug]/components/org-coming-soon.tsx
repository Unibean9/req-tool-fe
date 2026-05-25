import type { ReactNode } from "react";

type OrgComingSoonProps = {
  title: string;
  description?: ReactNode;
};

export function OrgComingSoon({ title, description }: OrgComingSoonProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card/60 px-6 py-12 text-center shadow-sm">
      <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description ?? "This feature is being built. Check back soon."}
      </p>
      <p className="text-muted-foreground/80 font-mono text-xs">Coming soon</p>
    </div>
  );
}
