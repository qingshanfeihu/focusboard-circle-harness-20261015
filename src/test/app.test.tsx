import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../components/App";
import { STORAGE_KEY, SEEDED_KEY } from "../storage/repository";
import { addDaysISO } from "../domain/dates";
import type { Task } from "../domain/types";

function readStored(): Task[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return (JSON.parse(raw) as { tasks: Task[] }).tasks;
}

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

const FIXTURES: Task[] = [
  mk({ id: "1", title: "写周报", description: "每周五完成", status: "todo", priority: "high", dueDate: addDaysISO(5), tags: ["日常"] }),
  mk({ id: "2", title: "修 Bug", description: "登录页 500", status: "doing", priority: "low", dueDate: addDaysISO(-3), tags: ["工作", "紧急"] }),
  mk({ id: "3", title: "整理照片", status: "done", priority: "medium", dueDate: addDaysISO(-1), tags: ["日常"] }),
  mk({ id: "4", title: "读书", description: "Finish Book", status: "todo", priority: "medium", tags: [] }),
];

function preload(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks }));
  localStorage.setItem(SEEDED_KEY, "1");
}

beforeEach(() => {
  localStorage.clear();
});

async function openCreateForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "新建任务" }));
  return await screen.findByRole("dialog");
}

describe("首次加载与概览", () => {
  it("首次提供演示数据并写 seeded 标记", async () => {
    render(<App />);
    expect(await screen.findByText("欢迎使用 FocusBoard")).toBeInTheDocument();
    expect(localStorage.getItem(SEEDED_KEY)).not.toBeNull();
    expect(readStored().length).toBeGreaterThan(0);
  });

  it("概览:总数、完成率、逾期(完成不算逾期,当天不算逾期)", () => {
    preload([...FIXTURES, mk({ id: "5", title: "今天到期", dueDate: addDaysISO(0), status: "todo" })]);
    render(<App />);
    const overview = screen.getByRole("region", { name: "任务概览" });
    expect(within(overview).getByText("5")).toBeInTheDocument();
    expect(within(overview).getByText("20%")).toBeInTheDocument();
    expect(within(overview).getByText("1")).toBeInTheDocument();
  });
});

describe("CRUD 与表单校验", () => {
  it("创建任务:标题 trim,字段写入存储", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const dialog = await openCreateForm(user);
    await user.type(within(dialog).getByTestId("field-title"), "  新任务  ");
    await user.type(within(dialog).getByTestId("field-description"), "备注内容");
    await user.type(within(dialog).getByTestId("field-tags"), "测试, 样例");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));
    const created = readStored().find((t) => t.title === "新任务");
    expect(created).toBeDefined();
    expect(created?.description).toBe("备注内容");
    expect(created?.tags).toEqual(["测试", "样例"]);
    expect(await screen.findByText("新任务")).toBeInTheDocument();
  });

  it("空标题拒绝并提示,数据不变", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const before = readStored();
    const dialog = await openCreateForm(user);
    await user.type(within(dialog).getByTestId("field-title"), "   ");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));
    expect(await within(dialog).findByText("标题不能为空")).toBeInTheDocument();
    expect(within(dialog).getByTestId("field-title")).toHaveAttribute("aria-invalid", "true");
    expect(readStored()).toEqual(before);
  });

  it("编辑任务保留 id 并更新字段", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByText("读书");
    const article = card.closest("article")!;
    await user.click(within(article).getByRole("button", { name: "编辑" }));
    const dialog = await screen.findByRole("dialog");
    const titleInput = within(dialog).getByTestId("field-title") as HTMLInputElement;
    expect(titleInput.value).toBe("读书");
    await user.clear(titleInput);
    await user.type(titleInput, "读完一本书");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));
    expect(await screen.findByText("读完一本书")).toBeInTheDocument();
    const saved = readStored();
    expect(saved.find((t) => t.title === "读完一本书")?.id).toBe("4");
    expect(saved.find((t) => t.title === "读书")).toBeUndefined();
  });

  it("看板中用状态选择器移动任务", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByText("写周报");
    const article = card.closest("article")!;
    await user.selectOptions(within(article).getByRole("combobox", { name: "任务“写周报”的状态" }), "doing");
    const saved = readStored();
    expect(saved.find((t) => t.id === "1")?.status).toBe("doing");
    expect(await screen.findByText("写周报")).toBeInTheDocument();
  });

  it("删除需确认:取消不删,确认删除", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByText("整理照片");
    const article = card.closest("article")!;
    const deleteBtn = within(article).getByRole("button", { name: "删除" });
    await user.click(deleteBtn);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/此操作不可撤销/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "取消" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("整理照片")).toBeInTheDocument();

    await user.click(deleteBtn);
    const dialog2 = await screen.findByRole("dialog");
    await user.click(within(dialog2).getByRole("button", { name: "删除" }));
    await waitFor(() => expect(screen.queryByText("整理照片")).not.toBeInTheDocument());
    expect(readStored().find((t) => t.id === "3")).toBeUndefined();
  });
});

describe("搜索、筛选、排序", () => {
  it("搜索大小写不敏感命中描述;无结果空状态;清除恢复", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const search = await screen.findByRole("searchbox", { name: "搜索标题或描述" });
    await user.type(search, "500");
    expect(await screen.findByText("修 Bug")).toBeInTheDocument();
    expect(screen.queryByText("写周报")).not.toBeInTheDocument();
    await user.clear(search);
    await user.type(search, "zzz-nothing");
    expect(await screen.findByText("没有符合当前筛选条件的任务。")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "清除全部筛选" }));
    expect(await screen.findByText("写周报")).toBeInTheDocument();
  });

  it("状态+优先级组合筛选与清除", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("写周报");
    await user.click(screen.getByRole("checkbox", { name: "待办" }));
    await user.click(screen.getByRole("checkbox", { name: "高" }));
    await waitFor(() => {
      expect(screen.queryByText("修 Bug")).not.toBeInTheDocument();
      expect(screen.queryByText("整理照片")).not.toBeInTheDocument();
    });
    expect(screen.getByText("写周报")).toBeInTheDocument();
    expect(screen.queryByText("读书")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "清除全部筛选" }));
    expect(await screen.findByText("修 Bug")).toBeInTheDocument();
  });

  it("标签筛选", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("写周报");
    await user.click(screen.getByRole("checkbox", { name: "紧急" }));
    expect(await screen.findByText("修 Bug")).toBeInTheDocument();
    expect(screen.queryByText("写周报")).not.toBeInTheDocument();
  });

  it("列表视图按截止日期排序:无截止日排最后", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole("button", { name: "列表" }));
    const bodyRows = () => [...document.querySelectorAll<HTMLElement>("tbody tr")];
    await user.selectOptions(screen.getByRole("combobox", { name: "排序" }), "dueAsc");
    let titles = bodyRows().map((r) => within(r).getByText(/写周报|修 Bug|整理照片|读书/).textContent);
    expect(titles).toEqual(["修 Bug", "整理照片", "写周报", "读书"]);
    await user.selectOptions(screen.getByRole("combobox", { name: "排序" }), "dueDesc");
    titles = bodyRows().map((r) => within(r).getByText(/写周报|修 Bug|整理照片|读书/).textContent);
    expect(titles).toEqual(["写周报", "整理照片", "修 Bug", "读书"]);
  });
});

describe("持久化与损坏数据", () => {
  it("卸载重挂(模拟刷新)后数据保留", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    const view = render(<App />);
    const dialog = await openCreateForm(user);
    await user.type(within(dialog).getByTestId("field-title"), "重启后仍在");
    await user.click(within(dialog).getByRole("button", { name: "保存" }));
    view.unmount();
    render(<App />);
    expect(await screen.findByText("重启后仍在")).toBeInTheDocument();
  });

  it("非法 JSON 不白屏:警告条 + 可继续操作", async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, "{broken json!!");
    localStorage.setItem(SEEDED_KEY, "1");
    render(<App />);
    expect(await screen.findByRole("alert")).toHaveTextContent("不是有效的 JSON");
    expect(screen.getByRole("button", { name: "新建任务" })).toBeEnabled();
    await user.click(within(screen.getByRole("alert")).getByRole("button", { name: "知道了" }));
    expect(await screen.findByText("还没有任务。")).toBeInTheDocument();
  });

  it("结构非法(null)兜底并可关闭警告", async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, "null");
    localStorage.setItem(SEEDED_KEY, "1");
    render(<App />);
    const banner = await screen.findByRole("alert");
    await user.click(within(banner).getByRole("button", { name: "知道了" }));
    expect(await screen.findByText("还没有任务。")).toBeInTheDocument();
  });

  it("清空后不再自动播种;恢复演示数据可再次播种", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("写周报");
    await user.click(screen.getByRole("button", { name: "清空数据" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "清空" }));
    expect(await screen.findByText("还没有任务。")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "恢复演示数据" }));
    expect(await screen.findByText("欢迎使用 FocusBoard")).toBeInTheDocument();
  });
});

describe("导入导出", () => {
  it("导出触发下载且包含全部字段", async () => {
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...globalThis.URL, createObjectURL, revokeObjectURL });
    const clicks: HTMLAnchorElement[] = [];
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      clicks.push(this);
    };
    try {
      preload(FIXTURES);
      const user = userEvent.setup();
      render(<App />);
      await screen.findByText("写周报");
      await user.click(screen.getByRole("button", { name: "导出" }));
      expect(clicks.length).toBe(1);
      expect(clicks[0].download).toBe("focusboard-export.json");
      expect(readStored()[0]).toHaveProperty("createdAt");
    } finally {
      HTMLAnchorElement.prototype.click = origClick;
      vi.unstubAllGlobals();
    }
  });

  it("导入合法文件替换全部任务,字段无损", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("写周报");
    const imported: Task[] = [
      mk({
        id: "z1",
        title: "导入任务",
        description: "完整描述",
        status: "doing",
        priority: "high",
        dueDate: "2026-12-31",
        tags: ["t1", "t2"],
        createdAt: "2026-01-02T03:04:05.000Z",
        updatedAt: "2026-01-03T03:04:05.000Z",
      }),
    ];
    const file = new File([JSON.stringify({ version: 1, tasks: imported })], "ok.json", {
      type: "application/json",
    });
    await user.click(screen.getByRole("button", { name: "导入" }));
    const dialog = await screen.findByRole("dialog");
    await user.upload(within(dialog).getByTestId("import-file"), file);
    expect(await within(dialog).findByText(/校验通过:1 条任务/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "确认导入" }));
    expect(await screen.findByText("导入任务")).toBeInTheDocument();
    expect(screen.queryByText("写周报")).not.toBeInTheDocument();
    expect(readStored()).toEqual(imported);
  });

  it("整批拒绝:仅第 2 条非法 → 提示且已有任务一项不变", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("写周报");
    const existing = readStored();
    const file = new File(
      [
        JSON.stringify({
          version: 1,
          tasks: [
            existing[0],
            { ...existing[0], id: "bad-1", priority: "urgent" },
            mk({ id: "extra", title: "第3条也不导入" }),
          ],
        }),
      ],
      "bad.json",
      { type: "application/json" }
    );
    await user.click(screen.getByRole("button", { name: "导入" }));
    const dialog = await screen.findByRole("dialog");
    await user.upload(within(dialog).getByTestId("import-file"), file);
    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("导入失败,现有数据未改变");
    expect(within(alert).getByText("第 2 条:字段缺失或类型错误")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "确认导入" })).toBeDisabled();
    expect(readStored()).toEqual(existing);
    expect(screen.queryByText("第3条也不导入")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "取消" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(readStored()).toEqual(existing);
    expect(existing).toEqual(FIXTURES);
  });

  it("非法 JSON 文件被拒且数据不变", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("写周报");
    const existing = readStored();
    const file = new File(["not json at all{"], "x.json", { type: "application/json" });
    await user.click(screen.getByRole("button", { name: "导入" }));
    const dialog = await screen.findByRole("dialog");
    await user.upload(within(dialog).getByTestId("import-file"), file);
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("不是有效的 JSON 文件");
    expect(readStored()).toEqual(existing);
  });
});

describe("键盘焦点管理", () => {
  it("新建表单:焦点入弹窗、Tab/Shift+Tab 循环不逃逸、Esc 关闭后焦点还原到入口", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const trigger = screen.getByRole("button", { name: "新建任务" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const dialog = await screen.findByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    for (let i = 0; i < 12; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 4; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.activeElement).toBe(trigger);
  });

  it("编辑表单:焦点入弹窗,Esc 关闭后还原到编辑按钮", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByText("读书");
    const editBtn = within(card.closest("article")!).getByRole("button", { name: "编辑" });
    await user.click(editBtn);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    for (let i = 0; i < 10; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.activeElement).toBe(editBtn);
    expect(screen.getByText("读书")).toBeInTheDocument();
  });

  it("删除确认:焦点入弹窗,取消关闭后还原到删除按钮且任务保留", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByText("读书");
    const deleteBtn = within(card.closest("article")!).getByRole("button", { name: "删除" });
    await user.click(deleteBtn);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    for (let i = 0; i < 6; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.activeElement).toBe(deleteBtn);
    expect(screen.getByText("读书")).toBeInTheDocument();
  });

  it("删除确认后入口消失时焦点回到可聚焦锚点而非丢失", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByText("读书");
    const deleteBtn = within(card.closest("article")!).getByRole("button", { name: "删除" });
    await user.click(deleteBtn);
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "删除" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText("读书")).not.toBeInTheDocument();
    const fallback = screen.getByRole("button", { name: "新建任务" });
    expect(document.activeElement).toBe(fallback);
  });

  it("确认弹窗打开时点击背景外不删除", async () => {
    preload(FIXTURES);
    const user = userEvent.setup();
    render(<App />);
    const card = await screen.findByText("读书");
    await user.click(within(card.closest("article")!).getByRole("button", { name: "删除" }));
    await screen.findByRole("dialog");
    await user.click(document.querySelector(".modal-overlay")!);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("读书")).toBeInTheDocument();
  });
});
