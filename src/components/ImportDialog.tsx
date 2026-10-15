import { useRef, useState } from "react";
import type { ChangeEvent, RefObject } from "react";
import type { Task } from "../domain/types";
import { importTasksFromText } from "../storage/importExport";
import Modal from "./Modal";

interface Props {
  containerRef?: RefObject<HTMLDivElement | null>;
  onImported: (tasks: Task[]) => void;
  onClose: () => void;
}

export default function ImportDialog({ containerRef, onImported, onClose }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, setPending] = useState<Task[] | null>(null);
  const [fileName, setFileName] = useState("");

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPending(null);
    const text = await file.text();
    const result = importTasksFromText(text);
    if (result.ok) {
      setPending(result.tasks);
      setErrors([]);
    } else {
      setErrors(result.errors);
      setPending(null);
    }
  };

  return (
    <Modal labelledBy="import-title" onClose={onClose} containerRef={containerRef}>
      <h2 id="import-title" className="modal-title">
        导入任务(JSON)
      </h2>
      <div className="modal-body">
        <label className="field">
          <span className="field-label">选择文件</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onFile}
            data-testid="import-file"
          />
        </label>
        {fileName !== "" && <p className="import-filename">已选择:{fileName}</p>}
        {errors.length > 0 && (
          <div className="field-error" role="alert">
            <p>导入失败,现有数据未改变:</p>
            <ul>
              {errors.slice(0, 8).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        {pending !== null && (
          <p className="import-ready">
            校验通过:{pending.length} 条任务。导入将替换当前全部任务。
          </p>
        )}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>
          取消
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={pending === null}
          onClick={() => pending !== null && onImported(pending)}
        >
          确认导入
        </button>
      </div>
    </Modal>
  );
}
