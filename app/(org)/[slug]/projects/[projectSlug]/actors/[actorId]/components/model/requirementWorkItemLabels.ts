/** Nhãn tiếng Việt cho status / priority (form + badge canvas). */

export const WORK_ITEM_STATUS_LABELS_VI: Record<string, string> = {
  draft: "Nháp",
  active: "Đang làm",
  done: "Hoàn thành",
  archived: "Lưu trữ",
};

export const WORK_ITEM_PRIORITY_LABELS_VI: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Khẩn cấp",
};

export function workItemStatusLabel(status: string): string {
  return WORK_ITEM_STATUS_LABELS_VI[status] ?? status;
}

export function workItemPriorityLabel(priority: string): string {
  return WORK_ITEM_PRIORITY_LABELS_VI[priority] ?? priority;
}
