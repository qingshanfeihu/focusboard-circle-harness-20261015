import type { Task } from "../domain/types";
import { PRIORITY_LABELS } from "../domain/types";
import { isOverdue, todayISO } from "../domain/dates";

interface Props {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Task["status"]) => void;
}

export default function ListView({ tasks, onEdit, onDelete, onStatusChange }: Props) {
  const today = todayISO();
  return (
    <div className="list-wrap">
      <table className="list">
        <caption className="sr-only">任务列表</caption>
        <thead>
          <tr>
            <th scope="col">标题</th>
            <th scope="col">状态</th>
            <th scope="col">优先级</th>
            <th scope="col">截止日期</th>
            <th scope="col">标签</th>
            <th scope="col">操作</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const overdue = isOverdue(t, today);
            return (
              <tr key={t.id} className={overdue ? "row-overdue" : undefined}>
                <td>
                  <span className="row-title">{t.title}</span>
                  {t.description !== "" && <p className="row-desc">{t.description}</p>}
                </td>
                <td>
                  <select
                    aria-label={`任务“${t.title}”的状态`}
                    value={t.status}
                    onChange={(e) => onStatusChange(t, e.target.value as Task["status"])}
                  >
                    <option value="todo">待办</option>
                    <option value="doing">进行中</option>
                    <option value="done">完成</option>
                  </select>
                </td>
                <td>{PRIORITY_LABELS[t.priority]}</td>
                <td>
                  {t.dueDate ?? "—"}
                  {overdue && <span className="overdue-mark">(逾期)</span>}
                </td>
                <td>{t.tags.length > 0 ? t.tags.map((tag) => `#${tag}`).join(" ") : "—"}</td>
                <td className="row-actions">
                  <button type="button" className="btn small" onClick={() => onEdit(t)}>
                    编辑
                  </button>
                  <button type="button" className="btn small danger" onClick={() => onDelete(t)}>
                    删除
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
