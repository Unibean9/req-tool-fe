/**
 * Chuẩn lỗi API (FastAPI validation): `{ detail: string | { loc, msg, ... }[] }`.
 */

export interface ApiValidationItem {
  loc?: (string | number)[];
  msg: string;
  type?: string;
  input?: string;
  ctx?: Record<string, unknown>;
}

interface ApiProblemValidationItem {
  field?: string;
  message?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatValidationDetail(detail: unknown): string | null {
  if (typeof detail === "string") {
    const t = detail.trim();
    return t || null;
  }
  if (isRecord(detail)) {
    const message = detail.message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
    const nestedDetail = detail.detail;
    if (typeof nestedDetail === "string" && nestedDetail.trim()) {
      return nestedDetail.trim();
    }
  }
  if (!Array.isArray(detail)) return null;
  const messages: string[] = [];
  for (const item of detail) {
    if (!item || typeof item !== "object") continue;
    const msg = (item as { msg?: unknown }).msg;
    if (typeof msg === "string") {
      const m = msg.trim();
      if (m) messages.push(m);
    }
  }
  return messages.length ? messages.join("\n") : null;
}

function formatProblemErrors(errors: unknown): string | null {
  if (!Array.isArray(errors)) return null;

  const messages: string[] = [];
  for (const item of errors) {
    if (!item || typeof item !== "object") continue;
    const { field, message } = item as ApiProblemValidationItem;
    const text = typeof message === "string" ? message.trim() : "";
    if (!text) continue;
    messages.push(
      typeof field === "string" && field.trim()
        ? `${field.trim()}: ${text}`
        : text
    );
  }

  return messages.length ? messages.join("\n") : null;
}

/** Gộp `detail` từ body JSON response thành một chuỗi hiển thị (hoặc null). */
export function formatMessageFromValidationBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const value = body as { detail?: unknown; errors?: unknown };
  return (
    formatProblemErrors(value.errors) ??
    formatValidationDetail(value.detail)
  );
}

export function getProblemDetailObject(
  errorOrBody: unknown
): Record<string, unknown> | null {
  const body =
    isRecord(errorOrBody) && "data" in errorOrBody
      ? (errorOrBody as { data?: unknown }).data
      : errorOrBody;
  if (!isRecord(body)) return null;
  return isRecord(body.detail) ? body.detail : null;
}

export function getDependencyConflictArtifactIds(error: unknown): string[] {
  const detail = getProblemDetailObject(error);
  if (!detail || !Array.isArray(detail.artifact_ids)) return [];
  return detail.artifact_ids.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
}

/**
 * Lấy chuỗi lỗi cho toast / UI từ lỗi axios interceptor (`ApiError`), `Error`, hoặc body có `detail`.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const e = error as { message?: unknown; data?: unknown };
    const fromData = formatMessageFromValidationBody(e.data);
    if (fromData) return fromData;
    const fromTop = formatMessageFromValidationBody(error);
    if (fromTop) return fromTop;
    if (typeof e.message === "string") {
      const m = e.message.trim();
      if (m) return m;
    }
  }
  if (error instanceof Error) {
    const m = error.message.trim();
    if (m) return m;
  }
  if (typeof error === "string") {
    const m = error.trim();
    if (m) return m;
  }
  return fallback;
}
