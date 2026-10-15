import { describe, expect, it } from "vitest";
import { clearAll, hasSeeded, loadTasks, markSeeded, saveTasks, STORAGE_KEY } from "../storage/repository";
import { importTasksFromText, exportTasks } from "../storage/importExport";
import { serializeTasksDocument } from "../domain/validation";
import type { Task } from "../domain/types";

class MemStore {
  private map = new Map<string, string>();
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

const task: Task = {
  id: "a",
  title: "A",
  description: "desc",
  status: "doing",
  priority: "high",
  dueDate: "2026-10-20",
  tags: ["x", "y"],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("loadTasks 容错", () => {
  it("键不存在 → 空且无失败", () => {
    const r = loadTasks(new MemStore());
    expect(r.failure).toBeNull();
    expect(r.tasks).toEqual([]);
  });
  it("非法 JSON → failure json,不抛错", () => {
    const s = new MemStore();
    s.setItem(STORAGE_KEY, "{oops");
    const r = loadTasks(s);
    expect(r.failure).toBe("json");
    expect(r.tasks).toEqual([]);
  });
  it("合法 JSON 但类型错(null/字符串/数组)→ failure shape", () => {
    for (const raw of ["null", '"hi"', "[1,2]", '{"version":1,"tasks":"nope"}']) {
      const s = new MemStore();
      s.setItem(STORAGE_KEY, raw);
      expect(loadTasks(s).failure).toBe("shape");
    }
  });
  it("混合合法+非法条目 → 整批拒绝并报告", () => {
    const s = new MemStore();
    s.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        tasks: [task, { id: "b", title: "B", status: "unknown", priority: "low", tags: [] }],
      })
    );
    const r = loadTasks(s);
    expect(r.failure).toBe("shape");
    expect(r.tasks).toEqual([]);
  });
  it("空 tasks 数组 → 合法", () => {
    const s = new MemStore();
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks: [] }));
    const r = loadTasks(s);
    expect(r.failure).toBeNull();
    expect(r.tasks).toEqual([]);
  });
});

describe("saveTasks / seed 标记", () => {
  it("保存后读回一致", () => {
    const s = new MemStore();
    expect(saveTasks(s, [task])).toBe(true);
    expect(loadTasks(s).tasks).toEqual([task]);
  });
  it("存储抛错时返回 false", () => {
    const boom = new MemStore();
    boom.setItem = () => {
      throw new Error("quota");
    };
    expect(saveTasks(boom, [task])).toBe(false);
  });
  it("markSeeded 后 hasSeeded 为真", () => {
    const s = new MemStore();
    expect(hasSeeded(s)).toBe(false);
    markSeeded(s);
    expect(hasSeeded(s)).toBe(true);
  });
  it("clearAll 不 reseed → 清空且 seeded", () => {
    const s = new MemStore();
    saveTasks(s, [task]);
    const left = clearAll(s, { reseed: false });
    expect(left).toEqual([]);
    expect(hasSeeded(s)).toBe(true);
  });
  it("clearAll reseed → 演示数据", () => {
    const s = new MemStore();
    const tasks = clearAll(s, { reseed: true });
    expect(tasks.length).toBeGreaterThan(0);
    expect(loadTasks(s).tasks).toEqual(tasks);
  });
});

describe("导入导出 round-trip", () => {
  it("导出→导入字段全等", () => {
    const text = exportTasks([task]);
    const r = importTasksFromText(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tasks).toEqual([task]);
  });
  it("空文件报错", () => {
    expect(importTasksFromText("  ").ok).toBe(false);
  });
  it("非法 JSON 报错", () => {
    const r = importTasksFromText("{bad json");
    expect(r.ok === false && r.errors).toEqual(["不是有效的 JSON 文件"]);
  });
  it("仅第 2 条非法 → 整批拒绝并指出位置", () => {
    const doc = serializeTasksDocument([
      task,
      { ...task, id: "b", title: "" },
      { ...task, id: "c", title: "C" },
    ]);
    const r = importTasksFromText(JSON.stringify(doc));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join("")).toContain("第 2 条");
  });
});

describe("repository 与 jsdom localStorage 集成", () => {
  it("真实 localStorage 读写一致", () => {
    saveTasks(localStorage, [task]);
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(loadTasks(localStorage).tasks).toEqual([task]);
  });
});
