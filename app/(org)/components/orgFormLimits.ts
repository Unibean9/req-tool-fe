/** Giới hạn ký tự form tổ chức (tạo / đổi tên). */
export const ORG_NAME_MAX_CHARS = 80;

export function clampOrgName(value: string): string {
  return value.slice(0, ORG_NAME_MAX_CHARS);
}
