import type { Priority, Status, Task } from "./types";
import { isOverdue, todayISO } from "./dates";

export interface Filters {
  search: string;
  statuses: Status[];
  priorities: Priority[];
  tags: string[];
}

export type SortMode = "manual" | "dueAsc" | "dueDesc";

export const EMPTY_FILTERS: Filters = {
  search: "",
  statuses: [],
  priorities: [],
  tags: [],
};

export function hasActiveFilters(filters: Filters, sort: SortMode): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.statuses.length > 0 ||
    filters.priorities.length > 0 ||
    filters.tags.length > 0 ||
    sort !== "manual"
  );
}

export function filterTasks(tasks: Task[], filters: Filters): Task[] {
  const q = filters.search.trim().toLowerCase();
  return tasks.filter((t) => {
    if (q !== "") {
      const hay = `${t.title}\n${t.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.statuses.length > 0 && !filters.statuses.includes(t.status)) return false;
    if (filters.priorities.length > 0 && !filters.priorities.includes(t.priority)) return false;
    if (filters.tags.length > 0 && !filters.tags.some((tag) => t.tags.includes(tag))) return false;
    return true;
  });
}

export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  if (mode === "manual") return tasks;
  const dated = tasks.filter((t) => t.dueDate !== null);
  const undated = tasks.filter((t) => t.dueDate === null);
  const sorted = [...dated].sort((a, b) => {
    const cmp = (a.dueDate as string).localeCompare(b.dueDate as string);
    return mode === "dueAsc" ? cmp : -cmp;
  });
  return [...sorted, ...undated];
}

export function allTags(tasks: Task[]): string[] {
  const set = new Set<string>();
  for (const t of tasks) for (const tag of t.tags) set.add(tag);
  return [...set].sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

export interface Overview {
  total: number;
  completed: number;
  overdue: number;
  completionRate: number | null;
}

export function computeOverview(tasks: Task[], today = todayISO()): Overview {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.filter((t) => isOverdue(t, today)).length;
  return {
    total,
    completed,
    overdue,
    completionRate: total === 0 ? null : Math.round((completed / total) * 100),
  };
}
