"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Widths come from --app-drawer-width (responsive in globals.css); lg and xl are wider multiples of it.
const WIDTHS = {
  md: "md:w-[min(60vw,var(--app-drawer-width))]",
  lg: "md:w-[min(65vw,calc(var(--app-drawer-width)*1.25))]",
  xl: "md:w-[min(70vw,calc(var(--app-drawer-width)*1.7))]",
};

// Contextual detail panel: a right drawer from md up, a bottom sheet below. Children stay mounted
// while closed (hidden), so typed drafts, tabs and scroll positions survive closing and reopening.
export default function GameDrawer({ open, onClose, title, subtitle, width = "md", children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={open ? "fixed inset-0 z-50 flex items-end justify-end bg-navy-950/70 backdrop-blur-sm md:items-stretch" : "hidden"} onClick={onClose} aria-hidden={!open}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`drawer-in glass-strong flex max-h-[88vh] w-full flex-col rounded-t-2xl md:max-h-none md:rounded-none md:rounded-l-2xl md:border-y-0 md:border-r-0 ${WIDTHS[width]}`}
      >
        <header className="flex items-start gap-3 border-b border-line/70 px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-extrabold text-ink">{title}</h2>
            {subtitle && <p className="truncate text-xs text-ink-dim">{subtitle}</p>}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={`Close ${title}`} className="grid size-8 shrink-0 place-items-center rounded-lg app-border bg-surface text-ink-dim transition-colors hover:border-cyan hover:text-cyan-bright">
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}
