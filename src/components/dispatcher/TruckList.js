"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid, List, X, ArrowRight } from "lucide-react";
import { useGameProgress } from "@/hooks/useGameProgress";
import { fleetCounts, fleetOptions, filterFleet, getFleetRow, getFleetRows, SORT_OPTIONS, sortFleet, statusesPresent } from "@/lib/fleet";
import GameDrawer from "@/components/game/GameDrawer";
import TruckCard from "./TruckCard";
import TruckDetails from "./TruckDetails";
import { EquipmentBadge, StatusPill, STATUS_DOT } from "./fleetUi";

// Kept for TruckProfile, which shows the same status pills.
export const truckStatusStyle = {
  Available: "bg-success/15 text-success",
  "On Load": "bg-cyan/15 text-cyan-bright",
  "In Maintenance": "bg-gold/15 text-gold-bright",
  Unavailable: "bg-danger/15 text-danger",
};

const SELECT = "h-9 rounded-lg app-border bg-navy-900 px-2 text-sm text-ink";

// Fleet control: summary, quick status chips, search and filters, a grid or list of trucks, and a
// details drawer. `onSelect(truckId)` opens the full truck profile (the Mission 1 surface).
export default function TruckList({ onSelect }) {
  const router = useRouter();
  const { state } = useGameProgress();
  const [filters, setFilters] = useState({ query: "", status: "", equipment: "", location: "", dispatch: "" });
  const [sort, setSort] = useState("default");
  const [mode, setMode] = useState("grid");
  const [openId, setOpenId] = useState(null);

  const rows = useMemo(() => getFleetRows(state), [state]);
  const counts = useMemo(() => fleetCounts(rows), [rows]);
  const options = useMemo(() => fleetOptions(rows), [rows]);
  const visible = useMemo(() => sortFleet(filterFleet(rows, filters), sort), [rows, filters, sort]);
  const open = openId ? getFleetRow(rows, openId) : null;
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const filtered = Object.values(filters).some(Boolean);

  const chips = [{ id: "", label: "All", count: counts.total }, ...statusesPresent(rows).map((s) => ({ id: s, label: s, count: counts.byStatus[s] ?? 0 }))];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-bright">Fleet control</p>
          <h1 className="text-2xl font-extrabold text-ink">Truck Fleet</h1>
          <p className="text-sm text-ink-dim">Monitor truck availability, equipment, location and driver assignment.</p>
        </div>
        <div className="flex items-center gap-3">
          {counts.healthPct != null && (
            <div className="liquid-border liquid-border-subtle rounded-xl app-border bg-navy-900/60 px-3 py-2" title="Available + On Load, out of all trucks">
              <p className="label-xs">Fleet health</p>
              <p className="text-sm font-extrabold tabular-nums text-ink">{counts.healthPct}% operational</p>
              <div className="mt-1 h-1 w-28 overflow-hidden rounded-full bg-navy-950" role="presentation">
                <div className="h-full rounded-full bg-linear-to-r from-cyan to-success" style={{ width: `${counts.healthPct}%` }} />
              </div>
            </div>
          )}
          <p className="rounded-xl app-border bg-navy-900/60 px-3 py-2 text-sm font-extrabold tabular-nums text-ink">
            {counts.total} <span className="text-xs font-semibold text-ink-dim">Trucks</span>
          </p>
        </div>
      </header>

      <section aria-label="Fleet summary" className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        {chips.map((c) => {
          const active = filters.status === c.id;
          return (
            <button
              key={c.label}
              type="button"
              aria-pressed={active}
              onClick={() => set({ status: c.id })}
              className={`flex items-center justify-between gap-2 rounded-xl app-border px-3 py-2 text-left transition ${active ? "liquid-border liquid-border-strong app-border-active bg-cyan/10" : " bg-navy-900/60 hover:border-cyan/50"}`}
            >
              <span className="flex items-center gap-2 whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-ink-dim">
                {c.id && <span className={`size-2 rounded-full ${STATUS_DOT[c.id] ?? "bg-ink-dim"}`} aria-hidden="true" />}
                {c.label}
              </span>
              <span className="text-xl font-extrabold tabular-nums text-ink">{c.count}</span>
            </button>
          );
        })}
      </section>

      <section aria-label="Search and filters" className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-44 flex-1">
          <span className="sr-only">Search trucks</span>
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-dim" aria-hidden="true" />
          <input value={filters.query} onChange={(e) => set({ query: e.target.value })} placeholder="Search trucks..." className="h-9 w-full rounded-lg app-border bg-navy-900 pl-8 pr-2 text-sm text-ink placeholder:text-ink-dim" />
        </label>
        <select aria-label="Filter by equipment" value={filters.equipment} onChange={(e) => set({ equipment: e.target.value })} className={SELECT}>
          <option value="">All equipment</option>
          {options.equipment.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Filter by location" value={filters.location} onChange={(e) => set({ location: e.target.value })} className={SELECT}>
          <option value="">All locations</option>
          {options.locations.map((o) => <option key={o}>{o}</option>)}
        </select>
        <select aria-label="Filter by dispatch" value={filters.dispatch} onChange={(e) => set({ dispatch: e.target.value })} className={SELECT}>
          <option value="">Any dispatch</option>
          <option value="assigned">On a dispatch</option>
          <option value="free">No dispatch</option>
        </select>
        <select aria-label="Sort trucks" value={sort} onChange={(e) => setSort(e.target.value)} className={SELECT}>
          {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>Sort: {o.label}</option>)}
        </select>
        <div role="group" aria-label="View" className="flex overflow-hidden rounded-lg app-border ">
          {[["grid", LayoutGrid, "Grid view"], ["list", List, "List view"]].map(([id, Icon, label]) => (
            <button key={id} type="button" aria-label={label} aria-pressed={mode === id} onClick={() => setMode(id)} className={`grid size-9 place-items-center ${mode === id ? "bg-cyan/20 text-cyan-bright" : "bg-navy-900 text-ink-dim hover:text-ink"}`}>
              <Icon className="size-4" aria-hidden="true" />
            </button>
          ))}
        </div>
        {filtered && (
          <button type="button" onClick={() => setFilters({ query: "", status: "", equipment: "", location: "", dispatch: "" })} className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-bold text-cyan-bright hover:underline">
            <X className="size-3.5" aria-hidden="true" /> Clear
          </button>
        )}
      </section>

      <p className="text-xs text-ink-dim" aria-live="polite">
        Showing {visible.length} of {counts.total} trucks
      </p>

      {visible.length === 0 ? (
        <p className="rounded-2xl app-border border-dashed px-4 py-10 text-center text-sm text-ink-dim">No trucks match these filters.</p>
      ) : mode === "grid" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,16.5rem),1fr))] gap-3 xl:gap-4">
          {visible.map((r) => (
            <TruckCard key={r.truck.id} row={r} selected={openId === r.truck.id} onOpen={setOpenId} onViewDispatch={(route) => router.push(route)} />
          ))}
        </div>
      ) : (
        <div className="panel">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] whitespace-nowrap text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-ink-dim">
                  {["Truck", "Equipment", "Driver", "Location", "Status", "Current dispatch", ""].map((h) => (
                    <th key={h || "action"} scope="col" className="px-3 py-2.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/50">
                {visible.map((r) => (
                  <tr key={r.truck.id} aria-selected={openId === r.truck.id} className="cursor-pointer hover:bg-surface-2/40" onClick={() => setOpenId(r.truck.id)}>
                    <td className="px-3 py-2.5">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(r.truck.id); }} className="text-left">
                        <span className="block font-bold text-ink">{r.truck.id}</span>
                        <span className="block text-xs text-ink-dim">{r.truck.model}</span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5"><EquipmentBadge equipment={r.truck.equipment} /></td>
                    <td className="px-3 py-2.5 text-ink">{r.driver?.name ?? "-"}</td>
                    <td className="px-3 py-2.5 text-ink">{r.truck.location}</td>
                    <td className="px-3 py-2.5"><StatusPill status={r.status} /></td>
                    <td className="px-3 py-2.5 text-ink-dim">{r.dispatch ? r.dispatch.label : "-"}</td>
                    <td className="px-3 py-2.5 text-right">
                      {r.dispatch ? (
                        <button type="button" onClick={(e) => { e.stopPropagation(); router.push(r.dispatch.resumeRoute); }} className="inline-flex items-center gap-1 text-xs font-bold text-cyan-bright hover:underline">
                          View Dispatch <ArrowRight className="size-3.5" aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-bright">
                          View Truck <ArrowRight className="size-3.5" aria-hidden="true" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GameDrawer open={Boolean(open)} onClose={() => setOpenId(null)} title={open?.truck.id ?? "Truck"} subtitle={open?.truck.model}>
        {open && <TruckDetails row={open} onOpenProfile={(id) => { setOpenId(null); onSelect(id); }} onViewDispatch={(route) => router.push(route)} />}
      </GameDrawer>
    </div>
  );
}
