import { cn } from "@/lib/utils";

function IndexBadge({ index }: { index: number }) {
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 text-xs font-semibold tabular-nums text-foreground"
      aria-hidden
    >
      {index}
    </span>
  );
}

export function ProjectDashboardIndexedList({
  items,
  emptyLabel,
  className,
}: {
  items: string[];
  emptyLabel: string;
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-muted-foreground italic">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ol className={cn("space-y-3", className)}>
      {items.map((item, i) => (
        <li key={`${i}-${item}`} className="flex gap-3 text-sm">
          <IndexBadge index={i + 1} />
          <span className="min-w-0 flex-1 pt-0.5 leading-relaxed text-foreground/90">
            {item}
          </span>
        </li>
      ))}
    </ol>
  );
}
