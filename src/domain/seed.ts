import type { Task } from "./types";
import { addDaysISO } from "./dates";

export function seedTasks(now = new Date()): Task[] {
  const stamp = now.toISOString();
  const mk = (
    id: string,
    partial: Omit<Task, "id" | "createdAt" | "updatedAt">
  ): Task => ({ id, createdAt: stamp, updatedAt: stamp, ...partial });
  return [
    mk("seed-1", {
      title: "欢迎使用 FocusBoard",
      description: "这是一个本地任务看板。试试新建任务、筛选和切换视图。",
      status: "todo",
      priority: "medium",
      dueDate: addDaysISO(3, now),
      tags: ["入门"],
    }),
    mk("seed-2", {
      title: "整理本周待办",
      description: "把逾期任务重新安排到合适的日期。",
      status: "doing",
      priority: "high",
      dueDate: addDaysISO(-1, now),
      tags: ["日常", "重要"],
    }),
    mk("seed-3", {
      title: "阅读一篇长文章",
      description: "",
      status: "todo",
      priority: "low",
      dueDate: null,
      tags: ["学习"],
    }),
    mk("seed-4", {
      title: "导出数据备份",
      description: "使用 JSON 导出功能备份任务。",
      status: "done",
      priority: "medium",
      dueDate: addDaysISO(-2, now),
      tags: ["日常"],
    }),
  ];
}
