import type { Task } from "../domain/types";
import { PRIORITY_LABELS } from "../domain/types";
import { isOverdue, todayISO } from "../domain/dates";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Task["status"]) => void;
}

export default function TaskCard({ task, onEdit, onDelete, onStatusChange }: Props) {
  const overdue = isOverdue(task, todayISO());
  return (
    <article className={`card prio-${task.priority}${overdue ? " overdue" : ""}`}>
      <h3 className="card-title">{task.title}</h3>
      {task.description !== "" && <p className="card-desc">{task.description}</p>}
      <div className="card-meta">
        <span className={`tag prio prio-${task.priority}`}>{PRIORITY_LABELS[task.priority]}</span>
        {task.dueDate !== null && (
          <span className={`tag due${overdue ? " due-overdue" : ""}`}>
            {overdue ? "逾期 " : "截止 "}
            {task.dueDate}
          </span>
        )}
        {task.tags.map((t) => (
          <span key={t} className="tag">
            #{t}
          </span>
        ))}
      </div>
      <div className="card-actions">
        <label className="status-select">
          <span className="sr-only">状态</span>
          <select
            aria-label={`任务“${task.title}”的状态`}
            value={task.status}
            onChange={(e) => onStatusChange(task, e.target.value as Task["status"])}
          >
            <option value="todo">待办</option>
            <option value="doing">进行中</option>
            <option value="done">完成</option>
          </select>
        </label>
        <button type="button" className="btn small" onClick={() => onEdit(task)}>
          编辑
        </button>
        <button type="button" className="btn small danger" onClick={() => onDelete(task)}>
          删除
        </button>
      </div>
    </article>
  );
}
