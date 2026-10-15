import type { Task } from "./types";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDateOnly(value: string): boolean {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1) return false;
  const dt = new Date(y, mo - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
}

export function toISODateOnly(date: Date): string {
  const y = String(date.getFullYear()).padStart(4, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(now = new Date()): string {
  return toISODateOnly(now);
}

export function addDaysISO(offset: number, now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  return toISODateOnly(d);
}

type DueFields = Pick<Task, "status" | "dueDate">;

export function isOverdue(task: DueFields, today = todayISO()): boolean {
  if (task.status === "done") return false;
  if (task.dueDate === null) return false;
  return task.dueDate < today;
}
