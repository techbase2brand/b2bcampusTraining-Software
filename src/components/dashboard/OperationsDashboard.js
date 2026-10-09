"use client";

import * as Icons from "lucide-react";
import { Truck, Radio, Hourglass, CheckCircle2, AlertTriangle, ArrowRight, Trophy, Star, Flame, Zap, MapPin, Gauge, Clock, PhoneCall, HeartPulse, Activity } from "lucide-react";
import { dashboardCopy } from "@/data/dashboardStatus";
import { features } from "@/data/features";
import { formatCurrency } from "@/lib/text";
import GameButton from "@/components/game/GameButton";
import StatusBadge, { toneClasses } from "./StatusBadge";

// Per-card accent: Total cyan, Active blue, Pending amber, Completed green, Delayed red.
const CARD_STYLE = {
  total: { icon: Truck, icon_: "text-cyan-bright bg-cyan/12", accent: "border-l-cyan" },
  active: { icon: Radio, icon_: "text-[#6fb0ff] bg-blue/15", accent: "border-l-blue" },
  pending: { icon: Hourglass, icon_: "text-gold-bright bg-gold/12", accent: "border-l-gold" },
  completed: { icon: CheckCircle2, icon_: "text-success bg-success/12", accent: "border-l-success" },
  delayed: { icon: AlertTriangle, icon_: "text-danger bg-danger/12", accent: "border-l-danger" },
};

function Panel({ title, action, children, className = "", id, icon: Icon }) {
  return (
    <section id={id} className={`rounded-2xl app-border bg-surface/90 p-3.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-ink">
          {Icon && <Icon className="size-3.5 text-cyan-bright" aria-hidden="true" />}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Fact({ label, children, wide = false, valueClass = "text-ink" }) {
  return (
    <div className={`min-w-0 ${wide ? "col-span-2" : ""}`}>
      <dt className="label-xs">{label}</dt>
      <dd className={`truncate text-sm font-semibold ${valueClass}`}>{children}</dd>
    </div>
  );
}

// Compact stat tile used by the tracking summary.
function Tile({ icon: Icon, label, children, wide = false }) {
  return (
    <div className={`min-w-0 rounded-xl app-border bg-navy-900/60 px-2.5 py-2 ${wide ? "col-span-2" : ""}`}>
      <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-ink-dim">
        <Icon className="size-3" aria-hidden="true" /> {label}
      </p>
      <div className="mt-0.5 truncate text-sm font-bold text-ink">{children}</div>
    </div>
  );
}

// Top row: five compact stat cards. Every number is calculated from the saved simulation
// (lib/dashboardStats.js).
export function StatCards({ cards, onNavigate }) {
  return (
    <section aria-label="Dispatch statistics" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
      {cards.map((c, i) => {
        const s = CARD_STYLE[c.id];
        const Icon = s.icon;
        const body = (
          <>
            <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${s.icon_}`}>
              <Icon className="size-[1.1rem]" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-[11px] font-bold uppercase tracking-wide text-ink-dim">{c.label}</p>
              <p className="text-2xl font-extrabold tabular-nums leading-none text-ink">{c.value}</p>
              <p className="mt-1 truncate text-[11px] leading-tight text-ink-dim">{c.supporting}</p>
            </div>
          </>
        );
        const cls = `flex items-center gap-2.5 glow-card rounded-xl app-border border-l-4 bg-surface/80 px-3 py-2.5 ${s.accent} ${i === cards.length - 1 ? "col-span-2 sm:col-span-1" : ""}`;
        if (c.navId) {
          return (
            <button key={c.id} type="button" onClick={() => onNavigate(c.navId)} className={`${cls} transition-colors hover:bg-surface-2`}>
              {body}
            </button>
          );
        }
        if (c.anchor) {
          return (
            <a key={c.id} href={c.anchor} className={`${cls} transition-colors hover:bg-surface-2`}>
              {body}
            </a>
          );
        }
        return (
          <div key={c.id} className={cls}>
            {body}
          </div>
        );
      })}
    </section>
  );
}

// The shipment currently being worked, from the real carried-forward state. Never fabricated.
export function CurrentShipment({ current, hasPending, actions, onNavigate, onOpenRoute }) {
  if (!current) {
    const target = hasPending ? actions.find((a) => a.navId === "dispatch") : actions.find((a) => a.navId === "load-board");
    return (
      <Panel title="Active Shipment" icon={Truck}>
        <div className="mt-3 grid place-items-center rounded-xl app-border border-dashed px-4 py-6 text-center">
          <Truck className="size-7 text-ink-dim" aria-hidden="true" />
          <p className="mt-2 text-sm font-semibold text-ink">{dashboardCopy.emptyShipment}</p>
          {target && (
            <GameButton size="sm" className="mt-3" onClick={() => onNavigate(target.navId)}>
              {hasPending ? "View Dispatches" : "Open Load Board"} <ArrowRight className="size-3.5" aria-hidden="true" />
            </GameButton>
          )}
        </div>
      </Panel>
    );
  }
  const canTrack = actions.some((a) => a.navId === "tracking");
  return (
    <section aria-label="Active shipment" className="glass-strong liquid-border liquid-border--still overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-line/70 bg-linear-to-r from-blue/20 via-blue/5 to-transparent px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">Active Shipment</p>
          <p className="flex flex-wrap items-baseline gap-x-3 text-2xl font-extrabold leading-tight text-ink">
            {current.reference}
            <span className="text-sm font-semibold text-ink-dim">
              {current.origin} → {current.destination}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge statusId={current.statusId} label={current.statusLabel} />
          {current.health && <StatusBadge health={current.health} label={current.health} />}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3.5 sm:grid-cols-3">
        <Fact label="Driver">{current.driverName ?? "-"}</Fact>
        <Fact label="Truck">{current.truckId ?? "-"}</Fact>
        <Fact label="Broker">{current.brokerName ?? "-"}</Fact>
        <Fact label="Agreed rate" valueClass="text-success">
          {formatCurrency(current.agreedRate)}
        </Fact>
        <Fact label="Current location">{current.location ?? "-"}</Fact>
        <Fact label="ETA">{current.eta ?? "-"}</Fact>
      </dl>
      {canTrack && (
        <div className="border-t border-line/60 px-4 py-2.5">
          <GameButton size="sm" onClick={() => onOpenRoute(current.resumeRoute)}>
            {current.label}: View Tracking <ArrowRight className="size-3.5" aria-hidden="true" />
          </GameButton>
        </div>
      )}
    </section>
  );
}

export function TrackingSummary({ tracking }) {
  return (
    <Panel title="Tracking Summary" icon={Activity}>
      {tracking ? (
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <Tile icon={MapPin} label="Location" wide>
            {tracking.location}
          </Tile>
          <Tile icon={Gauge} label="Miles left">
            {tracking.milesRemaining} mi
          </Tile>
          <Tile icon={Clock} label="ETA">
            {tracking.eta}
          </Tile>
          <Tile icon={HeartPulse} label="Health">
            <StatusBadge health={tracking.health} label={tracking.health} />
          </Tile>
          <Tile icon={PhoneCall} label="Last check call">
            {tracking.lastCheckCall ? tracking.lastCheckCall.time : "None yet"}
          </Tile>
        </div>
      ) : (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl app-border border-dashed px-3 py-3 text-xs text-ink-dim">
          <Radio className="size-4 shrink-0" aria-hidden="true" /> Tracking has not started yet. Location, ETA and check calls appear here once a shipment is moving.
        </div>
      )}
    </Panel>
  );
}

export function NeedsAttention({ items, onNavigate, onOpenRoute }) {
  return (
    <Panel title="Needs Attention" icon={AlertTriangle}>
      {items.length ? (
        <ul className="mt-2.5 space-y-1.5">
          {items.map((a) => (
            <li key={a.id} className={`flex items-start gap-2 rounded-lg app-border px-2.5 py-1.5 text-xs leading-snug text-ink ${toneClasses[a.tone]}`}>
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">{a.text}</span>
              {(a.route || a.navId) && (
                <button type="button" onClick={() => (a.route ? onOpenRoute(a.route) : onNavigate(a.navId))} className="shrink-0 font-bold underline-offset-2 hover:underline">
                  Open
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2.5 flex items-center gap-2 rounded-lg app-border app-border-success bg-success/8 px-3 py-2.5 text-sm font-semibold text-success">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" /> {dashboardCopy.allClear}
        </p>
      )}
    </Panel>
  );
}

export function DispatchOverview({ records, onNavigate, onOpenRoute }) {
  return (
    <Panel
      id="dispatch-overview"
      title="Dispatch Overview"
      icon={Truck}
      className="scroll-mt-20"
      action={
        <span className="flex items-center gap-1.5">
          <button type="button" onClick={() => onOpenRoute("/dispatcher/dispatches")} className="rounded-md app-border px-2 py-0.5 text-[11px] font-semibold text-ink transition-colors hover:border-cyan hover:text-cyan-bright">
            View all
          </button>
          <button type="button" onClick={() => onNavigate("load-board")} className="rounded-md app-border app-border-active bg-cyan/10 px-2 py-0.5 text-[11px] font-bold text-cyan-bright transition-colors hover:bg-cyan/20">
            + New Dispatch
          </button>
        </span>
      }
    >
      {records.length ? (
        <div className="mt-2.5 max-h-72 overflow-auto rounded-xl app-border app-border-subtle">
          <table className="w-full min-w-[58rem] text-left text-xs">
            <thead className="sticky top-0 bg-navy-900 text-[11px] uppercase tracking-wide text-ink-dim">
              <tr>
                {["Dispatch", "Load", "Driver", "Truck", "Route", "Rate", "Stage", "Status", "ETA", "Action"].map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line/50">
              {records.map((r) => (
                <tr key={r.slug} className="transition-colors hover:bg-cyan/5">
                  <td className="whitespace-nowrap px-3 py-2 font-bold text-ink">#{r.number}</td>
                  <td className="px-3 py-2 font-bold text-ink">{r.reference ?? <span className="font-normal text-ink-dim">{r.shortlistCount} shortlisted</span>}</td>
                  <td className="px-3 py-2 text-ink">{r.driverName ?? "-"}</td>
                  <td className="px-3 py-2 text-ink">{r.truckId ?? "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink">{r.route ?? "-"}</td>
                  <td className="px-3 py-2 font-semibold tabular-nums text-success">{r.agreedRate != null ? formatCurrency(r.agreedRate) : "-"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-dim">{r.stageLabel}</td>
                  <td className="px-3 py-2">
                    <span className="flex flex-wrap items-center gap-1">
                      <StatusBadge statusId={r.statusId} label={r.statusLabel} />
                      {r.category === "active" && r.health && r.health !== "ON TRACK" && <StatusBadge health={r.health} label={r.health} />}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-ink-dim">{r.eta ?? "-"}</td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => onOpenRoute(r.resumeRoute)} className="rounded-md app-border app-border-active bg-cyan/10 px-2 py-0.5 text-[11px] font-bold text-cyan-bright transition-colors hover:bg-cyan/20">
                      {r.completed ? "View" : "Resume"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-2.5 rounded-xl app-border border-dashed px-3 py-4 text-center text-xs text-ink-dim">No dispatches yet. Start one from the Load Board.</p>
      )}
    </Panel>
  );
}

export function RecentActivity({ events, context }) {
  return (
    <Panel title="Recent Activity" icon={Activity}>
      {context && <p className="mt-1 truncate text-[11px] text-ink-dim">{context}</p>}
      <ul className="mt-2.5 max-h-52 space-y-1.5 overflow-y-auto pr-1">
        {events.map((e) => (
          <li key={e.id} className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-2 border-b border-line/40 pb-1.5 text-xs leading-snug last:border-0">
            <span className="text-[11px] tabular-nums text-ink-dim">{e.time ?? ""}</span>
            <span className="text-ink">{e.message}</span>
          </li>
        ))}
        {events.length === 0 && <li className="rounded-lg app-border border-dashed px-3 py-4 text-center text-xs text-ink-dim">No operational activity yet.</li>}
      </ul>
    </Panel>
  );
}

export function QuickActions({ actions, onNavigate }) {
  return (
    <Panel title="Quick Actions" icon={Zap}>
      <div className="mt-2.5 grid grid-cols-2 gap-1.5">
        {actions.map((a) => {
          const Icon = Icons[a.icon];
          return (
            <button key={a.navId} type="button" onClick={() => onNavigate(a.navId)} className="flex items-center gap-1.5 rounded-lg app-border bg-navy-900/60 px-2.5 py-1.5 text-left text-[11px] font-semibold text-ink transition-colors hover:border-cyan/60 hover:text-cyan-bright">
              <Icon className="size-3.5 shrink-0 text-cyan-bright" aria-hidden="true" /> <span className="truncate">{a.label}</span>
            </button>
          );
        })}
        {actions.length === 0 && <p className="col-span-2 text-xs text-ink-dim">Complete missions to unlock more modules.</p>}
      </div>
    </Panel>
  );
}

export function TrainingProgress({ progress }) {
  const rows = [
    [Zap, "Level", progress.level],
    [Trophy, "XP", progress.xp],
    [Star, "Stars", progress.stars],
    ...(features.streak ? [[Flame, "Streak", progress.streak]] : []),
  ];
  return (
    <Panel title="Training Progress" icon={Trophy}>
      <dl className="mt-2.5 grid grid-cols-3 gap-1.5">
        {rows.map(([Icon, label, value]) => (
          <div key={label} className="rounded-lg bg-navy-900/60 px-1.5 py-1 text-center">
            <dd className="flex items-center justify-center gap-1 text-sm font-extrabold tabular-nums text-ink">
              <Icon className="size-3 text-gold-bright" aria-hidden="true" /> {value}
            </dd>
            <dt className="text-[11px] uppercase text-ink-dim">{label}</dt>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] text-ink-dim">
        Missions: <span className="font-bold text-ink">{progress.completed} / {progress.totalMissions}</span> completed
      </p>
      <p className="truncate text-[11px] text-ink-dim">
        Current: <span className="font-bold text-ink">{progress.currentMission ?? "All available missions complete"}</span>
      </p>
    </Panel>
  );
}
