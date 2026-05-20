import { NotFoundView } from "@/components/not-found-view";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Không tìm thấy trang",
  description:
    "Trang bạn truy cập không tồn tại hoặc đã được chuyển đi. Quay về Requirements | Bean9 để tiếp tục.",
  path: "/404",
  noindex: true,
});

export default function NotFoundPage() {
  return <NotFoundView />;
}
