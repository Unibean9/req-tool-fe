/**
 * Static site branding and origin helpers (build-time / env).
 * @see docs/SEO.md
 */

export const SITE = {
  name: "Requirements | Bean9",
  shortName: "Requirements | Bean9",
  defaultDescription:
    "Requirements | Bean9 — công cụ quản lý yêu cầu, actor, epic, feature và NFR cho dự án phần mềm.",
  locale: "vi_VN" as const,
};

/** Production: set NEXT_PUBLIC_APP_URL without trailing slash (e.g. https://example.com). */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return "http://localhost:3000";
}
