import { describe, expect, it } from "vitest";
import { addDaysISO, isOverdue, isValidDateOnly } from "../domain/dates";

describe("isValidDateOnly", () => {
  it("接受真实日期", () => {
    expect(isValidDateOnly("2026-10-15")).toBe(true);
    expect(isValidDateOnly("2024-02-29")).toBe(true);
  });
  it("拒绝非法值", () => {
    expect(isValidDateOnly("2025-02-29")).toBe(false);
    expect(isValidDateOnly("2026-13-01")).toBe(false);
    expect(isValidDateOnly("2026-00-10")).toBe(false);
    expect(isValidDateOnly("2026-10-00")).toBe(false);
    expect(isValidDateOnly("26-10-15")).toBe(false);
    expect(isValidDateOnly("2026/10/15")).toBe(false);
    expect(isValidDateOnly("")).toBe(false);
  });
});

describe("isOverdue", () => {
  const today = "2026-10-15";
  it("昨天未完成 → 逾期", () => {
    expect(isOverdue({ status: "todo", dueDate: "2026-10-14" }, today)).toBe(true);
    expect(isOverdue({ status: "doing", dueDate: "2020-01-01" }, today)).toBe(true);
  });
  it("今天不算逾期", () => {
    expect(isOverdue({ status: "todo", dueDate: today }, today)).toBe(false);
  });
  it("完成任务永不逾期", () => {
    expect(isOverdue({ status: "done", dueDate: "2026-10-01" }, today)).toBe(false);
  });
  it("无截止日不逾期", () => {
    expect(isOverdue({ status: "todo", dueDate: null }, today)).toBe(false);
  });
  it("addDaysISO 与今天比较", () => {
    const now = new Date(2026, 9, 15, 23, 30);
    expect(addDaysISO(-1, now)).toBe("2026-10-14");
    expect(addDaysISO(0, now)).toBe("2026-10-15");
    expect(isOverdue({ status: "todo", dueDate: addDaysISO(0, now) }, addDaysISO(0, now))).toBe(
      false
    );
    expect(isOverdue({ status: "todo", dueDate: addDaysISO(-1, now) }, addDaysISO(0, now))).toBe(
      true
    );
  });
});
