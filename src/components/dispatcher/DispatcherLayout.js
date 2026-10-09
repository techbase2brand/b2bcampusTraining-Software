"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import { dispatcherNav } from "@/data/navigation";
import { resolveNav } from "@/lib/access";
import { features } from "@/data/features";
import { useGameProgress } from "@/hooks/useGameProgress";
import GameTopBar from "@/components/game/GameTopBar";
import GameSidebar from "@/components/game/GameSidebar";
import BrandMark from "@/components/game/BrandMark";

// Shared frame for dispatcher pages after Phase 2: full-height sidebar, header with search,
// and a content area. Sidebar access comes from the cumulative progression rule (lib/access.js).
// `footer` renders at the bottom of the sidebar.
export default function DispatcherLayout({ activeId, highlightId = null, footer = null, children }) {
  const router = useRouter();
  const { state } = useGameProgress();
  const [drawer, setDrawer] = useState(false);

  const items = resolveNav(dispatcherNav, state);

  // Each unlocked item knows its route (data/navigation.js). Locked items are not clickable.
  function onSelect(id) {
    setDrawer(false);
    const item = items.find((i) => i.id === id);
    if (!item || item.status !== "enabled" || !item.route || id === activeId) return;
    router.push(item.route);
  }

  const sidebar = (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="liquid-border liquid-border-subtle m-3 rounded-xl p-3">
        <BrandMark />
        <p className="mt-2 text-xs text-ink-dim">Dispatcher Training</p>
      </div>
      <GameSidebar items={items} activeId={activeId} onSelect={onSelect} highlightId={highlightId} />
      {footer && <div className="mt-auto p-3 pb-14">{footer}</div>}
    </div>
  );

  return (
    <div className="game-backdrop flex min-h-screen">
      <aside className="app-sidebar sticky top-0 hidden h-dvh shrink-0 border-r border-cyan/10 bg-navy-900/80 lg:block">
        {sidebar}
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-navy-950/70" onClick={() => setDrawer(false)} />
          <div className="relative h-full w-[min(18rem,85vw)] border-r border-line bg-navy-900">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute right-2 top-2 p-2 text-ink-dim"
              onClick={() => setDrawer(false)}
            >
              <X className="size-4" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <GameTopBar
          showXp
          center={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawer(true)}
                aria-label="Open menu"
                className="grid size-9 shrink-0 place-items-center rounded-lg app-border bg-surface text-ink lg:hidden"
              >
                <Menu className="size-4" aria-hidden="true" />
              </button>
              {features.globalSearch && (
                <div className="hidden max-w-xl flex-1 items-center gap-2 rounded-xl app-border bg-surface px-4 py-2.5 text-sm text-ink-dim sm:flex">
                  <Search className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">Search loads, brokers, trucks...</span>
                </div>
              )}
            </div>
          }
        />
        <main className="game-grid min-w-0 flex-1 app-page">
          <div className="page-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
