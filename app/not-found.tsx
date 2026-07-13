import { NotFoundView } from "@/components/not-found-view";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Page not found",
  description:
    "The page you're looking for doesn't exist or has been moved. Return to Requirements | Bean9 to continue.",
  path: "/404",
  noindex: true,
});

export default function NotFoundPage() {
  return <NotFoundView />;
}
