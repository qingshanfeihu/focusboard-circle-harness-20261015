import { useMemo, useState } from "react";
import type { Task } from "../domain/types";
import type { TaskFields } from "../domain/validation";
import {
  EMPTY_FILTERS,
  allTags,
  computeOverview,
  filterTasks,
  hasActiveFilters,
  sortTasks,
} from "../domain/filtering";
import type { Filters, SortMode } from "../domain/filtering";
import { downloadJson, exportTasks } from "../storage/importExport";
import { useTasks } from "../state/useTasks";
import OverviewBar from "../components/OverviewBar";
import Toolbar from "../components/Toolbar";
import BoardView from "../components/BoardView";
import ListView from "../components/ListView";
import TaskFormModal from "../components/TaskFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import ImportDialog from "../components/ImportDialog";

export default function Board() {
  const {
    tasks,
    status,
    loadFailure,
    resetFromSeed,
    acknowledgeFailure,
    addTask,
    updateTask,
    deleteTask,
    setStatus,
    replaceAll,
    clearData,
  } = useTasks();
  const [view, setView] = useState<"board" | "list">("board");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortMode>("manual");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const visible = useMemo(() => sortTasks(filterTasks(tasks, filters), sort), [tasks, filters, sort]);
  const overview = useMemo(() => computeOverview(tasks), [tasks]);
  const tags = useMemo(() => allTags(tasks), [tasks]);
  const filtersActive = hasActiveFilters(filters, sort);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (task: Task) => {
    setEditing(task);
    setFormOpen(true);
  };
  const submitForm = (fields: TaskFields) => {
    if (editing !== null) updateTask(editing.id, fields);
    else addTask(fields);
    setFormOpen(false);
    setEditing(null);
  };
  const confirmDelete = () => {
    if (deleting !== null) deleteTask(deleting.id);
    setDeleting(null);
  };

  return (
    <div className="page">
      <header className="header">
        <h1>FocusBoard</h1>
        <div className="header-actions">
          <button type="button" className="btn ghost" onClick={() => setImportOpen(true)}>
            导入
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => downloadJson("focusboard-export.json", exportTasks(tasks))}
          >
            导出
          </button>
          {tasks.length === 0 && (
            <button type="button" className="btn ghost" onClick={resetFromSeed}>
              恢复演示数据
            </button>
          )}
          {tasks.length > 0 && (
            <button type="button" className="btn ghost danger-ghost" onClick={() => setClearOpen(true)}>
              清空数据
            </button>
          )}
        </div>
      </header>

      {status === "saveError" && (
        <div className="banner banner-warn" role="alert">
          无法保存到本地存储(可能空间不足或处于隐私模式),当前更改刷新后会丢失。
        </div>
      )}
      {loadFailure !== null && (
        <div className="banner banner-error" role="alert">
          <span>
            {loadFailure === "json"
              ? "本地保存的数据不是有效的 JSON,已忽略并重新开始。"
              : "本地保存的数据结构非法,已忽略并重新开始。"}
          </span>
          <button type="button" className="btn small" onClick={acknowledgeFailure}>
            知道了
          </button>
        </div>
      )}

      <OverviewBar overview={overview} />
      <Toolbar
        view={view}
        onViewChange={setView}
        filters={filters}
        sort={sort}
        allTags={tags}
        filtersActive={filtersActive}
        onFiltersChange={setFilters}
        onSortChange={setSort}
        onClearFilters={() => {
          setFilters(EMPTY_FILTERS);
          setSort("manual");
        }}
        onCreate={openCreate}
      />

      {tasks.length === 0 && loadFailure === null && !formOpen && deleting === null ? (
        <div className="empty-state" role="status">
          <p>还没有任务。</p>
          <button type="button" className="btn primary" onClick={openCreate}>
            创建第一个任务
          </button>
        </div>
      ) : tasks.length > 0 && visible.length === 0 ? (
        <div className="empty-state" role="status">
          <p>没有符合当前筛选条件的任务。</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setSort("manual");
            }}
          >
            清除筛选
          </button>
        </div>
      ) : view === "board" ? (
        <BoardView tasks={visible} onEdit={openEdit} onDelete={setDeleting} onStatusChange={(t, s) => setStatus(t.id, s)} />
      ) : (
        <ListView tasks={visible} onEdit={openEdit} onDelete={setDeleting} onStatusChange={(t, s) => setStatus(t.id, s)} />
      )}

      {formOpen && (
        <TaskFormModal
          task={editing}
          onSubmit={submitForm}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
      {deleting !== null && (
        <ConfirmDialog
          title="删除任务"
          body={`确定删除“${deleting.title}”吗?此操作不可撤销。`}
          confirmLabel="删除"
          danger
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
      {importOpen && (
        <ImportDialog
          onImported={(imported) => {
            replaceAll(imported);
            setImportOpen(false);
          }}
          onClose={() => setImportOpen(false)}
        />
      )}
      {clearOpen && (
        <ConfirmDialog
          title="清空全部数据"
          body="将删除所有任务且不再自动恢复演示数据,确定吗?"
          confirmLabel="清空"
          danger
          onConfirm={() => {
            clearData({ reseed: false });
            setClearOpen(false);
          }}
          onClose={() => setClearOpen(false)}
        />
      )}

      <footer className="footer">数据仅保存在本设备 localStorage,不上传网络。</footer>
    </div>
  );
}
