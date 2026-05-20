import {
  addDays,
  format,
  isBefore,
  isEqual,
  parse,
  startOfDay,
} from "date-fns";

const ISO_DATE_PATTERN = "yyyy-MM-dd";

/** ISO `YYYY-MM-DD` → hiển thị `dd/mm/yyyy` (vi-VN). */
export function formatProjectIsoDate(value: string | null | undefined): string {
  const t = (value ?? "").trim();
  if (!t) return "";
  const date = new Date(`${t}T12:00:00`);
  if (Number.isNaN(date.getTime())) return t;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatProjectDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  const start = formatProjectIsoDate(startDate);
  const end = formatProjectIsoDate(endDate);
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
}

/** Budget wire string (decimal lớn) → hiển thị; fallback raw nếu không parse được. */
export function formatProjectBudget(
  budget: string | null | undefined
): string {
  if (budget == null || !String(budget).trim()) return "—";
  const raw = String(budget).trim();
  const n = Number(raw);
  if (Number.isFinite(n)) {
    return new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 2,
    }).format(n);
  }
  return raw;
}

const VND_INTEGER_FORMAT = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

/** Hiển thị trong ô nhập ngân sách (100000 → `100.000`). */
export function formatBudgetAmountForInput(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return VND_INTEGER_FORMAT.format(amount);
}

/** Chỉ giữ chữ số từ chuỗi user nhập. */
export function parseBudgetInputDigits(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 0;
  const n = Number.parseInt(digits, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function budgetWireToNumber(budget: string | null | undefined): number {
  if (budget == null || !String(budget).trim()) return 0;
  const n = Number(String(budget).trim());
  return Number.isFinite(n) ? n : 0;
}

export function todayIsoDateLocal(): string {
  return toProjectIsoDate(startOfTodayLocal());
}

export function startOfTodayLocal(): Date {
  return startOfDay(new Date());
}

export function parseProjectIsoDate(iso: string | null | undefined): Date | undefined {
  const t = (iso ?? "").trim();
  if (!t) return undefined;
  const d = parse(t, ISO_DATE_PATTERN, new Date());
  if (Number.isNaN(d.getTime())) return undefined;
  return startOfDay(d);
}

export function toProjectIsoDate(date: Date): string {
  return format(startOfDay(date), ISO_DATE_PATTERN);
}

/** Ngày kết thúc tối thiểu = ngày sau ngày bắt đầu (không được trùng). */
export function minProjectEndIsoDate(startIso: string): string {
  const start = parseProjectIsoDate(startIso);
  const base = start ?? startOfTodayLocal();
  return toProjectIsoDate(addDays(base, 1));
}

export function isProjectIsoDateBeforeToday(iso: string): boolean {
  const d = parseProjectIsoDate(iso);
  if (!d) return false;
  return isBefore(d, startOfTodayLocal());
}

export function isProjectEndIsoInvalid(
  startIso: string,
  endIso: string
): boolean {
  const start = parseProjectIsoDate(startIso);
  const end = parseProjectIsoDate(endIso);
  if (!start || !end) return true;
  if (isBefore(end, startOfTodayLocal())) return true;
  if (isBefore(end, start) || isEqual(end, start)) return true;
  return false;
}
