import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import type { ReactNode } from "react";
import type { Task } from "../domain/types";
import { newId } from "../domain/types";
import type { TaskFields } from "../domain/validation";
import { clearAll, hasSeeded, loadTasks, markSeeded, saveTasks } from "../storage/repository";
import type { LoadFailure } from "../storage/repository";
import { seedTasks } from "../domain/seed";

export type TasksStatus = "ok" | "saveError";

interface State {
  tasks: Task[];
  status: TasksStatus;
}

type Action =
  | { type: "add"; fields: TaskFields }
  | { type: "update"; id: string; fields: TaskFields }
  | { type: "delete"; id: string }
  | { type: "setStatus"; id: string; status: Task["status"] }
  | { type: "replace"; tasks: Task[] }
  | { type: "saveError" };

function nowISO(): string {
  return new Date().toISOString();
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const task: Task = {
        id: newId(),
        ...action.fields,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      return { ...state, tasks: [task, ...state.tasks] };
    }
    case "update":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, ...action.fields, updatedAt: nowISO() } : t
        ),
      };
    case "delete":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "setStatus":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, status: action.status, updatedAt: nowISO() } : t
        ),
      };
    case "replace":
      return { ...state, tasks: action.tasks };
    case "saveError":
      return { ...state, status: "saveError" };
  }
}

interface TasksContextValue {
  tasks: Task[];
  status: TasksStatus;
  loadFailure: LoadFailure;
  resetFromSeed: () => void;
  acknowledgeFailure: () => void;
  addTask: (fields: TaskFields) => void;
  updateTask: (id: string, fields: TaskFields) => void;
  deleteTask: (id: string) => void;
  setStatus: (id: string, status: Task["status"]) => void;
  replaceAll: (tasks: Task[]) => void;
  clearData: (opts: { reseed: boolean }) => void;
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadTasks(localStorage));
  const [loadFailure, setLoadFailure] = useState<LoadFailure>(initial.failure);
  const [state, dispatch] = useReducer(reducer, {
    tasks:
      initial.tasks.length === 0 && initial.failure === null && !hasSeeded(localStorage)
        ? seedTasks()
        : initial.tasks,
    status: "ok",
  });

  useEffect(() => {
    if (!hasSeeded(localStorage)) markSeeded(localStorage);
    if (state.tasks.length > 0 || loadFailure === null) {
      const ok = saveTasks(localStorage, state.tasks);
      if (!ok) dispatch({ type: "saveError" });
    }
  }, [state.tasks, loadFailure]);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks: state.tasks,
      status: state.status,
      loadFailure,
      resetFromSeed: () => {
        const ok = saveTasks(localStorage, seedTasks());
        markSeeded(localStorage);
        if (ok) {
          dispatch({ type: "replace", tasks: seedTasks() });
          setLoadFailure(null);
        } else {
          dispatch({ type: "saveError" });
        }
      },
      acknowledgeFailure: () => {
        setLoadFailure(null);
        dispatch({ type: "replace", tasks: [] });
      },
      addTask: (fields) => dispatch({ type: "add", fields }),
      updateTask: (id, fields) => dispatch({ type: "update", id, fields }),
      deleteTask: (id) => dispatch({ type: "delete", id }),
      setStatus: (id, status) => dispatch({ type: "setStatus", id, status }),
      replaceAll: (tasks) => dispatch({ type: "replace", tasks }),
      clearData: (opts) => {
        const tasks = clearAll(localStorage, opts);
        setLoadFailure(null);
        dispatch({ type: "replace", tasks });
        if (opts.reseed) return;
        const ok = saveTasks(localStorage, []);
        if (!ok) dispatch({ type: "saveError" });
      },
    }),
    [state.tasks, state.status, loadFailure]
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (ctx === null) throw new Error("useTasks must be used within TasksProvider");
  return ctx;
}
