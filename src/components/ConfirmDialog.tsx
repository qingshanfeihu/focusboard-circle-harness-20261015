import type { RefObject } from "react";
import Modal from "./Modal";

interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  containerRef?: RefObject<HTMLDivElement | null>;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  containerRef,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal labelledBy="confirm-title" onClose={onClose} containerRef={containerRef}>
      <h2 id="confirm-title" className="modal-title">
        {title}
      </h2>
      <p className="confirm-body">{body}</p>
      <div className="modal-actions">
        <button type="button" className="btn" onClick={onClose}>
          取消
        </button>
        <button
          type="button"
          className={danger ? "btn danger" : "btn primary"}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
