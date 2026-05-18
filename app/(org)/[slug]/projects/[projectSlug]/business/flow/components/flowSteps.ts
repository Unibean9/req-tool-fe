/** Ký tự nối các bước trên wire / khi hiển thị dạng một dòng. */
export const FLOW_STEP_SEPARATOR = " -> ";

/** Tách `description` API thành các bước (ưu tiên ` -> `, fallback xuống dòng). */
export function parseFlowSteps(description: string): string[] {
  const trimmed = description.trim();
  if (!trimmed) return [""];

  if (trimmed.includes("->")) {
    const parts = trimmed
      .split(/\s*->\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 0 ? parts : [""];
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : [""];
}

/** Gộp các bước thành chuỗi lưu API. */
export function serializeFlowSteps(steps: string[]): string {
  return steps.map((s) => s.trim()).filter(Boolean).join(FLOW_STEP_SEPARATOR);
}
