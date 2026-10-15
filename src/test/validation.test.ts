import { describe, expect, it } from "vitest";
import { parseTagsText, validateTaskForm, parseTasksDocument } from "../domain/validation";

const baseInput = {
  title: "任务",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  tagsText: "",
};

describe("validateTaskForm", () => {
  it("标题 trim 后保存", () => {
    const r = validateTaskForm({ ...baseInput, title: "  带空白的标题  " });
    expect(r.ok && r.fields.title).toBe("带空白的标题");
  });
  it("标题仅空白被拒绝", () => {
    expect(validateTaskForm({ ...baseInput, title: "   " }).ok).toBe(false);
  });
  it("空标题被拒绝且带错误信息", () => {
    const r = validateTaskForm({ ...baseInput, title: "" });
    expect(r.ok === false && r.errors.title).toBe("标题不能为空");
  });
  it("标签解析:分隔符、去重、去空、保序", () => {
    expect(parseTagsText(" 日常, 学习; 日常，紧急、  ")).toEqual(["日常", "学习", "紧急"]);
  });
  it("非法截止日期被拒绝", () => {
    const r = validateTaskForm({ ...baseInput, dueDate: "2026-13-40" });
    expect(r.ok === false && r.errors.dueDate).toBe("截止日期格式无效");
  });
  it("有效字段全部保留", () => {
    const r = validateTaskForm({
      ...baseInput,
      title: "完整任务",
      description: " 描述文本 ",
      status: "doing",
      priority: "high",
      dueDate: "2026-10-20",
      tagsText: "a, b",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.fields).toEqual({
        title: "完整任务",
        description: "描述文本",
        status: "doing",
        priority: "high",
        dueDate: "2026-10-20",
        tags: ["a", "b"],
      });
    }
  });
});

describe("parseTasksDocument", () => {
  const good = {
    id: "a",
    title: "A",
    description: "",
    status: "todo",
    priority: "low",
    dueDate: null,
    tags: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
  it("要求 version=1", () => {
    expect(parseTasksDocument({ version: 2, tasks: [good] }).ok).toBe(false);
  });
  it("要求 tasks 数组", () => {
    expect(parseTasksDocument({ version: 1 }).ok).toBe(false);
    expect(parseTasksDocument({ version: 1, tasks: "x" }).ok).toBe(false);
  });
  it("拒绝重复 id", () => {
    const r = parseTasksDocument({ version: 1, tasks: [good, { ...good, title: "B" }] });
    expect(r.ok === false && r.errors.some((e) => e.includes("id 重复"))).toBe(true);
  });
  it("任一条目非法则整批拒绝(仅第 2 条非法)", () => {
    const bad = { ...good, id: "b", priority: "urgent" };
    const r = parseTasksDocument({ version: 1, tasks: [good, bad, { ...good, id: "c" }] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toEqual(["第 2 条:字段缺失或类型错误"]);
  });
  it("合法文档保留字段", () => {
    const r = parseTasksDocument({ version: 1, tasks: [good] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.tasks[0].id).toBe("a");
      expect(r.tasks[0].dueDate).toBeNull();
      expect(r.tasks[0].createdAt).toBe(good.createdAt);
    }
  });
});
