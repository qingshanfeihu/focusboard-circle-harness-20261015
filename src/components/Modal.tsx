import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";

interface ModalProps {
  labelledBy: string;
  onClose: () => void;
  containerRef?: RefObject<HTMLDivElement | null>;
  restoreFallback?: () => HTMLElement | null;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ labelledBy, onClose, containerRef, restoreFallback, children }: ModalProps) {
  const innerRef = useRef<HTMLDivElement | null>(null);
  const ref = containerRef ?? innerRef;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    if (dialog) {
      const first = dialog.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? dialog).focus();
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const nodes = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (nodes.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const stillIn = previouslyFocused !== null && document.contains(previouslyFocused);
      const fallback = restoreFallback?.();
      const target = stillIn
        ? previouslyFocused
        : (fallback ?? document.querySelector<HTMLElement>("[data-modal-focus-fallback]"));
      target?.focus();
    };
  }, [ref, restoreFallback]);

  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
