import type { Priority, Status, Task } from "./types";
import { isPriority, isStatus } from "./types";
import { isValidDateOnly } from "./dates";

export interface TaskFields {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  tags: string[];
}

export interface TaskFormInput {
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  tagsText: string;
}

export type FormErrors = Partial<Record<"title" | "dueDate", string>>;

export type FormResult = { ok: true; fields: TaskFields } | { ok: false; errors: FormErrors };

export function parseTagsText(text: string): string[] {
  const seen = new Set<string>();
  for (const raw of text.split(/[,，、;；]/)) {
    const tag = raw.trim();
    if (tag !== "") seen.add(tag);
  }
  return [...seen];
}

export function validateTaskForm(input: TaskFormInput): FormResult {
  const errors: FormErrors = {};
  const title = input.title.trim();
  if (title === "") {
    errors.title = "标题不能为空";
  } else if (title.length > 200) {
    errors.title = "标题不能超过 200 个字符";
  }
  const dueRaw = input.dueDate.trim();
  let dueDate: string | null = null;
  if (dueRaw !== "") {
    if (!isValidDateOnly(dueRaw)) {
      errors.dueDate = "截止日期格式无效";
    } else {
      dueDate = dueRaw;
    }
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  if (!isStatus(input.status) || !isPriority(input.priority)) {
    return { ok: false, errors: {} };
  }
  return {
    ok: true,
    fields: {
      title,
      description: input.description.trim(),
      status: input.status,
      priority: input.priority,
      dueDate,
      tags: parseTagsText(input.tagsText),
    },
  };
}

function isDateOnlyOrNull(v: unknown): v is string | null | undefined {
  return v === null || v === undefined || (typeof v === "string" && (v === "" || isValidDateOnly(v)));
}

function isoTimestamp(v: unknown): string {
  if (typeof v === "string" && v !== "" && !Number.isNaN(Date.parse(v))) return v;
  return new Date().toISOString();
}

export function parseTaskFields(raw: unknown): TaskFields | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.title !== "string") return null;
  const title = o.title.trim();
  if (title === "") return null;
  if (!isStatus(o.status) || !isPriority(o.priority)) return null;
  if (!isDateOnlyOrNull(o.dueDate)) return null;
  if (!Array.isArray(o.tags)) return null;
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const tag of o.tags) {
    if (typeof tag !== "string") return null;
    const t = tag.trim();
    if (t !== "" && !seen.has(t)) {
      seen.add(t);
      tags.push(t);
    }
  }
  return {
    title,
    description: typeof o.description === "string" ? o.description.trim() : "",
    status: o.status,
    priority: o.priority,
    dueDate: typeof o.dueDate === "string" && o.dueDate !== "" ? o.dueDate : null,
    tags,
  };
}

export interface ParsedDocument {
  version: number;
  tasks: Task[];
}

export type ImportParseResult =
  | { ok: true; tasks: Task[] }
  | { ok: false; errors: string[] };

export function parseTasksDocument(raw: unknown): ImportParseResult {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ["文件内容必须是 JSON 对象"] };
  }
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) {
    errors.push(`不支持的数据版本:${JSON.stringify(o.version)}`);
  }
  if (!Array.isArray(o.tasks)) {
    errors.push("缺少 tasks 数组");
    return { ok: false, errors };
  }
  const ids = new Set<string>();
  const tasks: Task[] = [];
  o.tasks.forEach((item, i) => {
    const where = `第 ${i + 1} 条`;
    if (typeof item !== "object" || item === null) {
      errors.push(`${where}:不是对象`);
      return;
    }
    const rec = item as Record<string, unknown>;
    if (typeof rec.id !== "string" || rec.id.trim() === "") {
      errors.push(`${where}:缺少有效 id`);
      return;
    }
    const id = rec.id.trim();
    if (ids.has(id)) {
      errors.push(`${where}:id 重复(${id})`);
      return;
    }
    const fields = parseTaskFields(rec);
    if (fields === null) {
      errors.push(`${where}:字段缺失或类型错误`);
      return;
    }
    ids.add(id);
    tasks.push({
      id,
      ...fields,
      createdAt: isoTimestamp(rec.createdAt),
      updatedAt: isoTimestamp(rec.updatedAt),
    });
  });
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, tasks };
}

export function serializeTasksDocument(tasks: Task[]): ParsedDocument {
  return { version: 1, tasks };
}
