import { useState } from "react";
import type { FormEvent, RefObject } from "react";
import type { Task } from "../domain/types";
import { validateTaskForm } from "../domain/validation";
import type { FormErrors, TaskFields } from "../domain/validation";
import Modal from "./Modal";

interface Props {
  task: Task | null;
  containerRef?: RefObject<HTMLDivElement | null>;
  onSubmit: (fields: TaskFields) => void;
  onClose: () => void;
}

export default function TaskFormModal({ task, containerRef, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<string>(task?.status ?? "todo");
  const [priority, setPriority] = useState<string>(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [tagsText, setTagsText] = useState(task ? task.tags.join(", ") : "");
  const [errors, setErrors] = useState<FormErrors>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateTaskForm({ title, description, status, priority, dueDate, tagsText });
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    onSubmit(result.fields);
  };

  return (
    <Modal labelledBy="task-form-title" onClose={onClose} containerRef={containerRef}>
      <form onSubmit={submit} noValidate>
        <h2 id="task-form-title" className="modal-title">
          {task ? "编辑任务" : "新建任务"}
        </h2>
        <div className="modal-body">
          <label className="field">
            <span className="field-label">标题(必填)</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={errors.title !== undefined}
              aria-describedby={errors.title ? "title-error" : undefined}
              data-testid="field-title"
            />
            {errors.title !== undefined && (
              <span id="title-error" className="field-error" role="alert">
                {errors.title}
              </span>
            )}
          </label>
          <label className="field">
            <span className="field-label">描述</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="field-description"
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span className="field-label">状态</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="todo">待办</option>
                <option value="doing">进行中</option>
                <option value="done">完成</option>
              </select>
            </label>
            <label className="field">
              <span className="field-label">优先级</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span className="field-label">截止日期(可选)</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              aria-invalid={errors.dueDate !== undefined}
              aria-describedby={errors.dueDate ? "due-error" : undefined}
              data-testid="field-duedate"
            />
            {errors.dueDate !== undefined && (
              <span id="due-error" className="field-error" role="alert">
                {errors.dueDate}
              </span>
            )}
          </label>
          <label className="field">
            <span className="field-label">标签(逗号分隔,可选)</span>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="例如:日常, 学习"
              data-testid="field-tags"
            />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="btn primary">
            保存
          </button>
        </div>
      </form>
    </Modal>
  );
}
