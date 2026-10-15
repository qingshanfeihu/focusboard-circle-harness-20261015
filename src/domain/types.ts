export type Status = "todo" | "doing" | "done";
export type Priority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const STATUSES: Status[] = ["todo", "doing", "done"];
export const PRIORITIES: Priority[] = ["low", "medium", "high"];

export const STATUS_LABELS: Record<Status, string> = {
  todo: "待办",
  doing: "进行中",
  done: "完成",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export function isStatus(v: unknown): v is Status {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}

export function isPriority(v: unknown): v is Priority {
  return typeof v === "string" && (PRIORITIES as string[]).includes(v);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
