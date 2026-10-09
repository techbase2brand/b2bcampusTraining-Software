"use client";

import { useEffect } from "react";

export default function GameModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-in glass-strong liquid-border liquid-border-strong flex max-h-[92dvh] w-[min(90vw,calc(var(--app-modal-width)*0.72))] flex-col rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-[calc(var(--app-card-padding)*1.5)]">{children}</div>
      </div>
    </div>
  );
}
