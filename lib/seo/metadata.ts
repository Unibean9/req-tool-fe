import type { Metadata } from "next";

import { SITE, getSiteUrl } from "./site";

const BRAND = "Requirements | Bean9";

/** Default social preview image (under `public/`). */
const DEFAULT_OG_IMAGE_PATH = "/Logo.png";

function socialTitle(title: string): string {
  return title.includes(BRAND) ? title : `${title} | ${BRAND}`;
}

/**
 * Standard page metadata: canonical, robots, Open Graph, Twitter (summary_large_image).
 * @see docs/SEO.md
 */
export function buildPageMetadata({
  title,
  description = SITE.defaultDescription,
  path,
  noindex,
}: {
  title: string;
  description?: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const siteUrl = getSiteUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalPath = normalizedPath;
  const pageUrl = `${siteUrl}${canonicalPath === "/" ? "" : canonicalPath}`;
  const ogImageUrl = `${siteUrl}${DEFAULT_OG_IMAGE_PATH}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url: pageUrl,
      title: socialTitle(title),
      description,
      siteName: SITE.name,
      images: [{ url: ogImageUrl, alt: SITE.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle(title),
      description,
      images: [ogImageUrl],
    },
  };
}

export function segmentForMetadataPath(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment.trim()));
  } catch {
    return encodeURIComponent(segment.trim());
  }
}

/** Root layout default metadata (includes title template). */
export function rootMetadata(): Metadata {
  const base = buildPageMetadata({
    title: SITE.name,
    description: SITE.defaultDescription,
    path: "/",
  });

  return {
    ...base,
    metadataBase: new URL(getSiteUrl()),
    title: { default: SITE.name, template: `%s | ${BRAND}` },
    keywords: ["Requirements | Bean9", "làm việc", "dự án", "tổ chức", "project", "workspace"],
  };
}
