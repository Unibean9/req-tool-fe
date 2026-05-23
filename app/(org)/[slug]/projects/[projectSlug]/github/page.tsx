import type { Metadata } from "next";
import { GitBranch, GitPullRequest, Link2, Sparkles, Zap } from "lucide-react";

import { buildPageMetadata, segmentForMetadataPath } from "@/lib/seo/metadata";
import { fetchProjectNameForMeta } from "@/lib/seo/fetchProjectNameForMeta";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectSlug: string }>;
}): Promise<Metadata> {
  const { slug, projectSlug } = await params;
  const projectName = await fetchProjectNameForMeta(
    decodeURIComponent(slug),
    decodeURIComponent(projectSlug)
  );
  const title = projectName ? `${projectName} | GitHub` : "GitHub";
  return buildPageMetadata({
    title,
    description: "Liên kết repository GitHub với dự án.",
    path: `/${segmentForMetadataPath(slug)}/projects/${segmentForMetadataPath(projectSlug)}/github`,
    noindex: true,
  });
}

const UPCOMING_FEATURES = [
  {
    icon: GitBranch,
    label: "Đồng bộ branch & commit",
    description: "Tự động trace requirements tới code changes.",
  },
  {
    icon: GitPullRequest,
    label: "Liên kết Pull Request",
    description: "Kết nối PR với user stories và acceptance criteria.",
  },
  {
    icon: Zap,
    label: "CI/CD Status",
    description: "Theo dõi trạng thái pipeline ngay trong workspace.",
  },
];

export default function ProjectGithubLinkPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
        {/* Icon cluster */}
        <div className="relative flex items-center justify-center">
          <div className="flex size-20 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm ring-4 ring-border/20">
            <Link2 className="size-10 text-foreground" aria-hidden />
          </div>
          <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-sm">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Sắp ra mắt
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Liên kết với GitHub
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Tính năng kết nối repository GitHub đang được phát triển. Bạn sẽ
            sớm có thể đồng bộ requirements với code và theo dõi tiến độ
            trực tiếp trong workspace.
          </p>
        </div>

        {/* Feature list */}
        <ul className="grid w-full gap-3 text-left">
          {UPCOMING_FEATURES.map(({ icon: Icon, label, description }) => (
            <li
              key={label}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
