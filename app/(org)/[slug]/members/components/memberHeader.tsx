export type MemberHeaderProps = {
  title?: string;
  description?: string;
};

export function MemberHeader({
  title = "Members",
  description = "View team leads, members, and their relationships within the organization.",
}: MemberHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
        {description}
      </p>
    </header>
  );
}
