import type { Task } from "../domain/types";
import { parseTasksDocument } from "../domain/validation";
import { seedTasks } from "../domain/seed";

export const STORAGE_KEY = "focusboard.…s.v1";
export const SEEDED_KEY = "focusboard.…d.v1";

export type LoadFailure = "json" | "shape" | null;

export interface LoadResult {
  tasks: Task[];
  failure: LoadFailure;
  rawAvailable: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function loadTasks(store: StorageLike): LoadResult {
  let raw: string | null = null;
  try {
    raw = store.getItem(STORAGE_KEY);
  } catch {
    return { tasks: [], failure: "json", rawAvailable: false };
  }
  if (raw === null) {
    return { tasks: [], failure: null, rawAvailable: false };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { tasks: [], failure: "json", rawAvailable: true };
  }
  const result = parseTasksDocument(parsed);
  if (!result.ok) {
    return { tasks: [], failure: "shape", rawAvailable: true };
  }
  return { tasks: result.tasks, failure: null, rawAvailable: true };
}

export function saveTasks(store: StorageLike, tasks: Task[]): boolean {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks }));
    return true;
  } catch {
    return false;
  }
}

export function hasSeeded(store: StorageLike): boolean {
  try {
    return store.getItem(SEEDED_KEY) !== null;
  } catch {
    return false;
  }
}

export function markSeeded(store: StorageLike): void {
  try {
    store.setItem(SEEDED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearAll(store: StorageLike, opts: { reseed: boolean }, now = new Date()): Task[] {
  try {
    if (opts.reseed) {
      const tasks = seedTasks(now);
      store.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tasks }));
      store.setItem(SEEDED_KEY, "1");
      return tasks;
    }
    store.removeItem(STORAGE_KEY);
    store.setItem(SEEDED_KEY, "1");
  } catch {
    /* ignore */
  }
  return [];
}
