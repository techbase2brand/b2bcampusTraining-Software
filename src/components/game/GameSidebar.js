"use client";

import * as Icons from "lucide-react";
import { Lock } from "lucide-react";
import { dispatcherNav } from "@/data/navigation";

// `highlightId` lets the mission engine glow a specific item (guided training).
export default function GameSidebar({ activeId, onSelect, highlightId, items = dispatcherNav }) {
  return (
    <nav aria-label="Dispatcher navigation" className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = Icons[item.icon];
        const locked = item.status === "locked";
        const preview = item.status === "preview";
        const active = activeId === item.id;

        return (
          <button
            key={item.id}
            type="button"
            disabled={locked || preview}
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect?.(item.id)}
            className={`liquid-border liquid-on-hover relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-linear-to-r from-cyan/20 to-blue/5 text-ink shadow-[inset_0_0_0_1px_rgb(37_217_255/0.35),0_0_16px_rgb(37_217_255/0.12)] before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-cyan-bright"
                : "text-ink-dim hover:translate-x-0.5 hover:bg-surface/60 hover:text-ink"
            } ${locked || preview ? "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-ink-dim" : ""} ${
              highlightId === item.id ? "guide-highlight" : ""
            }`}
          >
            <Icon className={`size-4 shrink-0 ${active ? "text-cyan-bright" : ""}`} aria-hidden="true" />
            <span className="flex-1 text-left">{item.label}</span>
            {locked && <Lock className="size-3.5" aria-label="Locked" />}
            {preview && (
              <span className="rounded bg-navy-800 px-1.5 py-0.5 text-[11px] uppercase text-gold">Preview</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
