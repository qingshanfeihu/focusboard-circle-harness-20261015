import { describe, expect, it } from "vitest";
import type { Task } from "../domain/types";
import {
  EMPTY_FILTERS,
  allTags,
  computeOverview,
  filterTasks,
  sortTasks,
} from "../domain/filtering";

const TODAY = "2026-10-15";

const mk = (partial: Partial<Task>): Task => ({
  id: "x",
  title: "t",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: null,
  tags: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...partial,
});

const tasks: Task[] = [
  mk({ id: "1", title: "写周报", description: "每周五完成", status: "todo", priority: "high", dueDate: "2026-10-20", tags: ["日常"] }),
  mk({ id: "2", title: "修 Bug", description: "登录页 500", status: "doing", priority: "low", dueDate: "2026-10-10", tags: ["工作", "紧急"] }),
  mk({ id: "3", title: "整理照片", status: "done", priority: "medium", dueDate: "2026-10-12", tags: ["日常"] }),
  mk({ id: "4", title: "读书", description: "Finish Book", status: "todo", priority: "medium", tags: [] }),
];

describe("filterTasks", () => {
  it("搜索标题,大小写不敏感", () => {
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, search: "book" }).map((t) => t.id)).toEqual(["4"]);
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, search: "修 Bug" }).map((t) => t.id)).toEqual(["2"]);
  });
  it("搜索描述", () => {
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, search: "500" }).map((t) => t.id)).toEqual(["2"]);
  });
  it("搜索前后空白忽略", () => {
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, search: "  周报 " }).map((t) => t.id)).toEqual(["1"]);
  });
  it("状态+优先级+标签组合", () => {
    const f = {
      ...EMPTY_FILTERS,
      statuses: ["todo" as const],
      priorities: ["high" as const, "medium" as const],
      tags: ["日常" as string],
    };
    expect(filterTasks(tasks, f).map((t) => t.id)).toEqual(["1"]);
  });
  it("搜索与筛选叠加", () => {
    const f = { ...EMPTY_FILTERS, search: "完成", statuses: ["todo" as const] };
    expect(filterTasks(tasks, f).map((t) => t.id)).toEqual(["1"]);
  });
  it("无命中返回空", () => {
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, search: "zzz" })).toEqual([]);
  });
});

describe("sortTasks", () => {
  it("dueAsc 无截止日排最后", () => {
    const ids = sortTasks(tasks, "dueAsc").map((t) => t.id);
    expect(ids).toEqual(["2", "3", "1", "4"]);
  });
  it("dueDesc 无截止日仍排最后", () => {
    const ids = sortTasks(tasks, "dueDesc").map((t) => t.id);
    expect(ids).toEqual(["1", "3", "2", "4"]);
  });
  it("manual 保持原顺序", () => {
    expect(sortTasks(tasks, "manual")).toBe(tasks);
  });
});

describe("allTags", () => {
  it("去重并包含全部标签", () => {
    const tags = allTags(tasks);
    expect([...tags].sort()).toEqual(["日常", "紧急", "工作"].sort());
    expect(new Set(tags).size).toBe(tags.length);
  });
});

describe("computeOverview", () => {
  it("总数/完成率/逾期(昨天逾期、今天不逾期、done 不逾期)", () => {
    const o = computeOverview(tasks, TODAY);
    expect(o.total).toBe(4);
    expect(o.completed).toBe(1);
    expect(o.completionRate).toBe(25);
    expect(o.overdue).toBe(1); // 仅 id=2 (2026-10-10, doing);id=3 done 不算
  });
  it("空列表完成率为 null", () => {
    expect(computeOverview([], TODAY).completionRate).toBeNull();
  });
  it("截止当天不逾期", () => {
    const o = computeOverview([mk({ dueDate: TODAY, status: "todo" })], TODAY);
    expect(o.overdue).toBe(0);
  });
});
