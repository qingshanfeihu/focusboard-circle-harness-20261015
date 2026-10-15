import type { Task } from "../domain/types";
import { STATUSES, STATUS_LABELS } from "../domain/types";
import TaskCard from "./TaskCard";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Task["status"]) => void;
}

export default function BoardView({ tasks, onEdit, onDelete, onStatusChange }: Props) {
  return (
    <div className="board">
      {STATUSES.map((status) => {
        const col = tasks.filter((t) => t.status === status);
        return (
          <section key={status} className="column" aria-label={`${STATUS_LABELS[status]}列`}>
            <header className="column-header">
              <h2>{STATUS_LABELS[status]}</h2>
              <span className="count">{col.length}</span>
            </header>
            <div className="column-body">
              {col.length === 0 ? (
                <p className="column-empty">暂无任务</p>
              ) : (
                col.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
