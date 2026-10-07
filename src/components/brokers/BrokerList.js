"use client";

import { useState } from "react";
import { Search, Star } from "lucide-react";
import { brokers } from "@/data/brokers";
import { phase5Page } from "@/data/phase5Missions";
import { formatLocation } from "@/lib/loadSelectors";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";
import BrokerAvatar, { STATUS_STYLE } from "./BrokerAvatar";

// Broker directory. Which broker is correct is never shown: the student has to read the load details.
export default function BrokerList({ m, highlight }) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const visible = brokers.filter((b) => {
    if (tab === "saved" && !m.savedBrokerIds.includes(b.id)) return false;
    if (tab === "recent" && !m.recentBrokerIds.includes(b.id)) return false;
    return !q || b.name.toLowerCase().includes(q) || formatLocation(b.locationId).toLowerCase().includes(q);
  });

  return (
    <TaskHighlight active={highlight === "broker-list"} className="h-full">
      <section aria-label="Brokers" className="panel flex h-full flex-col p-3">
        <h2 className="text-sm font-extrabold text-ink">{phase5Page.brokersTitle}</h2>

        <div role="tablist" className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg bg-navy-900 p-1 text-xs font-semibold">
          {phase5Page.tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md py-1.5 transition-colors ${tab === t.id ? "bg-blue text-white" : "text-ink-dim hover:text-ink"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <label className="mt-2.5 flex items-center gap-2 rounded-lg border border-line bg-navy-900 px-2.5 py-1.5 text-xs text-ink-dim focus-within:border-cyan">
          <Search className="size-3.5 shrink-0" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search brokers..."
            aria-label="Search brokers"
            className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-dim/70"
          />
        </label>

        {!m.run.started && <p className="mt-2 rounded-md bg-gold/10 px-2 py-1.5 text-[10px] text-ink-dim">Start the mission to choose a broker.</p>}
        <ul className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
          {visible.map((b) => {
            const active = m.viewBrokerId === b.id;
            const st = STATUS_STYLE[b.status];
            const saved = m.savedBrokerIds.includes(b.id);
            return (
              <li key={b.id} className="relative">
                <button
                  type="button"
                  onClick={() => m.selectBroker(b.id)}
                  disabled={!m.run.started}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 pr-7 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                    active ? "border-cyan-bright bg-cyan/10 shadow-[0_0_12px_rgb(37_217_255/0.18)]" : "border-line/70 bg-navy-900/60 enabled:hover:border-cyan/50"
                  }`}
                >
                  <BrokerAvatar broker={b} className="size-8 text-xs" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-bold leading-tight text-ink">{b.name}</span>
                    <span className="block truncate text-[10px] text-ink-dim">{formatLocation(b.locationId)}</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-ink-dim">
                      <span className="flex items-center gap-0.5 font-semibold text-ink">
                        <Star className="size-3 fill-gold-bright text-gold-bright" aria-hidden="true" /> {b.rating}
                      </span>
                      ({b.reviewCount} reviews)
                      <span className={`ml-auto flex items-center gap-1 font-semibold ${st.text}`}>
                        <span className={`size-1.5 rounded-full ${st.dot}`} /> {st.label}
                      </span>
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => m.toggleSaved(b.id)}
                  aria-label={saved ? `Remove ${b.name} from saved` : `Save ${b.name}`}
                  aria-pressed={saved}
                  className="absolute right-1.5 top-1.5 rounded p-0.5 text-ink-dim transition-colors hover:text-gold-bright"
                >
                  <Star className={`size-3.5 ${saved ? "fill-gold-bright text-gold-bright" : ""}`} aria-hidden="true" />
                </button>
              </li>
            );
          })}
          {visible.length === 0 && <li className="rounded-lg border border-dashed border-line p-4 text-center text-xs text-ink-dim">No brokers match.</li>}
        </ul>
      </section>
    </TaskHighlight>
  );
}
