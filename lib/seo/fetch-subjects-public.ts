export type PublicSubjectSeo = {
  slug: string;
  title?: string;
  updatedAt?: string;
};

function subjectsEndpoint(): string {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/").replace(/\/?$/, "/");
  const path =
    process.env.NEXT_PUBLIC_SEO_SUBJECTS_PATH?.replace(/^\//, "") ?? "api/v1/public/subjects";
  return new URL(path, base).toString();
}

/**
 * Cached public subjects for sitemap + dynamic metadata.
 * Adjust NEXT_PUBLIC_SEO_SUBJECTS_PATH / response shape to match your API.
 * @see docs/SEO.md
 */
export async function getPublicSubjectsForSeo(): Promise<PublicSubjectSeo[]> {
  try {
    const res = await fetch(subjectsEndpoint(), {
      next: { revalidate: 600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];

    const json: unknown = await res.json();
    const data = (json as { data?: unknown })?.data ?? json;

    if (!Array.isArray(data)) return [];

    const out: PublicSubjectSeo[] = [];
    for (const item of data) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      const slug = typeof rec.slug === "string" ? rec.slug : null;
      if (!slug) continue;
      const title = typeof rec.title === "string" ? rec.title : undefined;
      const updatedAt = typeof rec.updatedAt === "string" ? rec.updatedAt : undefined;
      out.push({ slug, title, updatedAt });
    }
    return out;
  } catch {
    return [];
  }
}

export async function getSubjectSeoBySlug(slug: string): Promise<PublicSubjectSeo | undefined> {
  const list = await getPublicSubjectsForSeo();
  return list.find((s) => s.slug === slug);
}
