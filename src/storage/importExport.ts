import type { Task } from "../domain/types";
import { parseTasksDocument, serializeTasksDocument } from "../domain/validation";
import type { ImportParseResult } from "../domain/validation";

export function exportTasks(tasks: Task[]): string {
  return JSON.stringify(serializeTasksDocument(tasks), null, 2);
}

export type ImportResult = ImportParseResult | { ok: false; errors: ["文件内容为空"] };

export function importTasksFromText(text: string): ImportResult {
  if (text.trim() === "") {
    return { ok: false, errors: ["文件内容为空"] };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, errors: ["不是有效的 JSON 文件"] };
  }
  return parseTasksDocument(parsed);
}

export function downloadJson(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
