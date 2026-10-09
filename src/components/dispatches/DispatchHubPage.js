"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Truck, Radio, Hourglass, CheckCircle2, AlertTriangle, ArrowRight, Activity, Siren, X } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { ROUTES } from "@/lib/dispatchRecords";
import { filterHub, getHub, HUB_SORTS, HUB_TABS, hubStats, sortHub, tabCounts } from "@/lib/dispatchHub";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import ActiveDispatchCard from "./ActiveDispatchCard";
import CompletedDispatchRow from "./CompletedDispatchRow";

const STAT_TILES = [
  { id: "total", label: "Total", icon: Truck, tone: "text-cyan-bright bg-cyan/12", edge: "border-l-cyan" },
  { id: "active", label: "Active", icon: Radio, tone: "text-[#6fb0ff] bg-blue/15", edge: "border-l-blue" },
  { id: "progress", label: "In Progress", icon: Hourglass, tone: "text-gold-bright bg-gold/12", edge: "border-l-gold" },
  { id: "completed", label: "Completed", icon: CheckCircle2, tone: "text-success bg-success/12", edge: "border-l-success" },
  { id: "atRisk", label: "At Risk", icon: AlertTriangle, tone: "text-danger bg-danger/12", edge: "border-l-danger" },
];

const TONE_TEXT = { cyan: "text-cyan-bright", blue: "text-[#7fb6ff]", amber: "text-gold-bright", red: "text-danger" };

// Dispatch operations hub. Read-only: it lists the existing dispatch records (the same ones the
// Dashboard counts); opening it never changes saved state. Resume / View go to each dispatch's own
// resume route, New Dispatch goes to the Load Board.
export default function DispatchHubPage() {
  const router = useRouter();
  const { state, allowed } = useRequireAccess();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("latest");

  const hub = useMemo(() => (allowed ? getHub(state) : null), [allowed, state]);
  if (!allowed || !hub) return <main className="game-backdrop min-h-screen" />;

  const { records, attention, activity } = hub;
  const stats = hubStats(records);
  const counts = tabCounts(records);
  const visible = sortHub(filterHub(records, { query, tab }), sort);
  const open = visible.filter((r) => !r.completed);
  const done = visible.filter((r) => r.completed);
  const go = (route) => router.push(route);
  const slugRoute = (slug) => records.find((r) => r.slug === slug)?.resumeRoute ?? ROUTES.hub;

  return (
    <DispatcherLayout activeId="dispatches">
      <div className="mx-auto max-w-[110rem] space-y-[var(--app-section-gap)]">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-bright">Operations hub</p>
            <h1 className="font-extrabold text-ink">Dispatches</h1>
            <p className="text-sm text-ink-dim">Every dispatch you have created. Open one to continue where you left off.</p>
          </div>
          <GameButton onClick={() => router.push(ROUTES.board)} className="liquid-border-strong">
            <Plus className="size-4" aria-hidden="true" /> New Dispatch
          </GameButton>
        </header>

        <section aria-label="Dispatch summary" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {STAT_TILES.map((t, i) => {
            const Icon = t.icon;
            return (
              <div key={t.id} className={`glass-strong flex items-center gap-2.5 rounded-xl app-border border-l-4 px-3 py-2.5 ${t.edge} ${i === STAT_TILES.length - 1 ? "col-span-2 sm:col-span-1" : ""}`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${t.tone}`}>
                  <Icon className="size-[1.1rem]" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold uppercase tracking-wide text-ink-dim">{t.label}</p>
                  <p data-stat={t.id} className="text-2xl font-extrabold tabular-nums leading-none text-ink">{stats[t.id]}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section aria-label="Search and filters" className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-52 flex-1">
            <span className="sr-only">Search dispatches</span>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-dim" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dispatch, load, route or driver..." className="h-9 w-full rounded-lg app-border bg-navy-900 pl-8 pr-2 text-sm text-ink placeholder:text-ink-dim" />
          </label>
          <div role="tablist" aria-label="Dispatch filter" className="flex gap-1 rounded-xl p-1">
            {HUB_TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold ${tab === t.id ? "bg-cyan/15 text-cyan-bright" : "text-ink-dim hover:text-ink"}`}>
                {t.label} <span className="tabular-nums opacity-70">{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <select aria-label="Sort dispatches" value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-lg app-border bg-navy-900 px-2 text-sm text-ink">
            {HUB_SORTS.map((s) => <option key={s.id} value={s.id}>Sort: {s.label}</option>)}
          </select>
          {(query || tab !== "all") && (
            <button type="button" onClick={() => { setQuery(""); setTab("all"); }} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-cyan-bright hover:underline">
              <X className="size-3.5" aria-hidden="true" /> Clear
            </button>
          )}
        </section>

        <div className="grid items-start gap-[var(--app-section-gap)] xl:grid-cols-[minmax(0,1fr)_clamp(17rem,22vw,22rem)]">
          <div className="min-w-0 space-y-[var(--app-section-gap)]">
            {records.length === 0 ? (
              <section className="panel grid place-items-center gap-2 p-8 text-center">
                <p className="text-base font-extrabold text-ink">No dispatches yet</p>
                <p className="text-sm text-ink-dim">Shortlist loads on the Load Board to start your first dispatch.</p>
                <GameButton onClick={() => router.push(ROUTES.board)}>
                  <Plus className="size-4" aria-hidden="true" /> New Dispatch
                </GameButton>
              </section>
            ) : visible.length === 0 ? (
              <p className="rounded-2xl app-border border-dashed px-4 py-10 text-center text-sm text-ink-dim">No dispatches match these filters.</p>
            ) : (
              <>
                {open.length > 0 && (
                  <section aria-label="Active dispatches">
                    <h2 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-ink">
                      <Radio className="size-3.5 text-cyan-bright" aria-hidden="true" /> Active dispatches <span className="tabular-nums text-ink-dim">{open.length}</span>
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,23rem),1fr))] gap-3">
                      {open.map((r) => <ActiveDispatchCard key={r.slug} record={r} onResume={go} />)}
                    </div>
                  </section>
                )}
                {done.length > 0 && (
                  <section aria-label="Completed dispatches">
                    <h2 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-ink-dim">
                      <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" /> Completed <span className="tabular-nums">{done.length}</span>
                    </h2>
                    <ul className="space-y-1.5">
                      {done.map((r) => <CompletedDispatchRow key={r.slug} record={r} onView={go} />)}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>

          <aside aria-label="Operational summary" className="grid min-w-0 gap-[var(--app-section-gap)] md:grid-cols-2 xl:grid-cols-1">
            <section className="glass-strong liquid-border-subtle rounded-2xl p-[var(--app-card-padding)]">
              <h2 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-ink">
                <Siren className="size-3.5 text-gold-bright" aria-hidden="true" /> Needs attention
              </h2>
              {attention.length === 0 ? (
                <p className="mt-2 text-sm text-success">{records.some((r) => !r.completed) ? "All active dispatches are on track." : "Nothing needs attention."}</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {attention.slice(0, 6).map((a) => (
                    <li key={a.id}>
                      <button type="button" onClick={() => go(a.route)} className="group flex w-full items-start gap-2 rounded-lg app-border app-border-subtle bg-navy-900/50 px-2.5 py-2 text-left text-xs leading-snug transition-colors hover:bg-navy-900">
                        <span className={`mt-0.5 size-2 shrink-0 rounded-full bg-current ${TONE_TEXT[a.tone] ?? "text-cyan-bright"}`} aria-hidden="true" />
                        <span className="min-w-0 flex-1 text-ink">{a.text}</span>
                        <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-cyan-bright opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="glass-strong liquid-border-subtle rounded-2xl p-[var(--app-card-padding)]">
              <h2 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-ink">
                <Activity className="size-3.5 text-cyan-bright" aria-hidden="true" /> Recent activity
              </h2>
              {activity.length === 0 ? (
                <p className="mt-2 text-sm text-ink-dim">No activity yet.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {activity.map((e) => (
                    <li key={e.id}>
                      <button type="button" onClick={() => go(slugRoute(e.dispatchSlug))} className="w-full rounded-md px-1 py-0.5 text-left text-xs leading-snug text-ink hover:bg-navy-900/60">
                        {e.message}
                        {e.time && <span className="block text-[11px] text-ink-dim">{e.time}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      </div>
    </DispatcherLayout>
  );
}
