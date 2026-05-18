export type OrgOnboardingSlide = {
  kicker: string;
  headline: string;
  detail: string;
};

export const ORG_ONBOARDING_SLIDES: readonly OrgOnboardingSlide[] = [
  {
    kicker: "Workspace",
    headline: "Chào mừng đến ReqFlow",
    detail:
      "Nơi requirements được tổ chức đúng cách ngay từ ngày đầu — không còn nằm rải rác trong sheet và chat.",
  },
  {
    kicker: "Cấu trúc",
    headline: "Backlog thành hệ thống",
    detail:
      "Agile và GitHub-first workflow: mọi mục đều có chỗ, có owner và có trace tới code.",
  },
  {
    kicker: "Khởi động",
    headline: "Project sẵn sàng làm việc",
    detail:
      "Hierarchy rõ ràng, conventions nhất quán và đồng bộ GitHub tự động khi team bắt đầu sprint.",
  },
  {
    kicker: "Phối hợp",
    headline: "Requirements có lộ trình",
    detail:
      "Phân tích, tổ chức và triển khai cùng một nguồn sự thật — team bám scope và tiến độ chặt hơn.",
  },
  {
    kicker: "Kết nối",
    headline: "Một flow thống nhất",
    detail:
      "Từ Business Capability đến Technical Task — không còn khoảng trống giữa nghiệp vụ và kỹ thuật.",
  },
] as const;
