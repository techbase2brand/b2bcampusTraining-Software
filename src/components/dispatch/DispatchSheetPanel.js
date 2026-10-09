"use client";

import { Check, Send, FileText, Clock, CircleHelp, Ban } from "lucide-react";
import GameButton from "@/components/game/GameButton";
import TaskHighlight from "@/components/dispatcher/TaskHighlight";

// Layout only: which sheet fields (by id) sit under which heading. Values come from the engine.
const SECTIONS = [
  { title: "Load", ids: ["load", "broker", "commodity", "weight", "equipment", "miles"] },
  { title: "Pickup", ids: ["pickup", "pickupTime"] },
  { title: "Delivery", ids: ["delivery", "deliveryTime"] },
  { title: "Driver / Truck", ids: ["driver", "truck"] },
  { title: "Rate", ids: ["rate"] },
  { title: "Special Instructions", ids: ["instructions"] },
];
const SHORT = { pickupTime: "When", deliveryTime: "When", pickup: "Where", delivery: "Where", rate: "Agreed", instructions: "Notes" };

const TONE = {
  amber: "app-border-warning bg-gold/10 text-gold-bright",
  green: "app-border-success bg-success/10 text-success",
  red: "app-border-error bg-danger/10 text-danger",
};

function StatusRow({ tone, Icon, children }) {
  return (
    <p className={`flex items-center gap-2 rounded-lg app-border px-2.5 py-1.5 text-xs font-bold ${TONE[tone]}`}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

// The dispatch sheet built from the negotiated load, agreed rate and selected driver. The student
// reviews it, sends it, reads the driver's response and finally confirms the assignment.
export default function DispatchSheetPanel({ m, highlight }) {
  const { d, entry, run } = m;
  const canAct = run.started && Boolean(entry);
  const byId = Object.fromEntries(m.sheet.map((f) => [f.id, f]));
  const accepted = d.response === "accepted";

  return (
    <section aria-label="Dispatch sheet" className="panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-line/70 bg-linear-to-r from-blue/15 to-transparent px-3 py-2">
        <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
          <FileText className="size-4 text-cyan-bright" aria-hidden="true" /> Dispatch Sheet
        </h2>
        <span className="shrink-0 rounded-full bg-cyan/15 px-2 py-0.5 text-[11px] font-bold tracking-wide text-cyan-bright" aria-label="Load status">
          {m.statusLabel}
        </span>
      </div>

      <div className="divide-y divide-line/50 px-3">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="py-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gold">{sec.title}</p>
            <dl className="mt-1 space-y-0.5">
              {sec.ids.map((id) => (
                <div key={id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
                  <dt className="pt-px text-[11px] text-ink-dim">{SHORT[id] ?? byId[id].label}</dt>
                  <dd className={`text-xs leading-snug ${id === "rate" ? "font-extrabold text-success" : "font-semibold text-ink"}`}>{byId[id].value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-line/60 bg-navy-900/40 px-3 py-2.5">
        {(d.dispatchSent || d.assigned) && (
          <div className="space-y-1" aria-live="polite">
            <StatusRow tone={accepted || d.assigned ? "green" : "amber"} Icon={accepted || d.assigned ? Check : Clock}>
              DISPATCH SENT
            </StatusRow>
            {d.response === "needs-clarification" && (
              <StatusRow tone="amber" Icon={CircleHelp}>
                NEEDS CLARIFICATION
              </StatusRow>
            )}
            {d.response === "declined" && (
              <StatusRow tone="red" Icon={Ban}>
                DECLINED
              </StatusRow>
            )}
            {accepted && (
              <StatusRow tone="green" Icon={Check}>
                DRIVER ACCEPTED ✓
              </StatusRow>
            )}
            {d.assigned && (
              <>
                <StatusRow tone="green" Icon={Check}>
                  ASSIGNMENT CONFIRMED
                </StatusRow>
                <StatusRow tone="green" Icon={Check}>
                  READY FOR PICKUP
                </StatusRow>
              </>
            )}
          </div>
        )}
        {d.response === "needs-clarification" && <p className="text-[11px] leading-snug text-ink-dim">The driver has a question in the chat. Answer it so they can accept.</p>}
        {d.response === "declined" && <p className="text-[11px] leading-snug text-ink-dim">The driver cannot take this load. Choose another driver.</p>}

        {!d.assigned && !d.dispatchSent && (
          <ol className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-dim" aria-label="Dispatch steps">
            <li className={d.dispatchReviewed ? "text-success" : "text-cyan-bright"}>1 Review</li>
            <li aria-hidden="true">→</li>
            <li className={d.dispatchReviewed ? "text-cyan-bright" : ""}>2 Send to driver</li>
          </ol>
        )}

        {d.assigned ? null : accepted ? (
          <TaskHighlight active={highlight === "confirm-assignment"}>
            <GameButton className="w-full" onClick={m.confirmAssignment}>
              Confirm Assignment
            </GameButton>
          </TaskHighlight>
        ) : !d.dispatchReviewed ? (
          <TaskHighlight active={highlight === "dispatch"}>
            <GameButton className="w-full" disabled={!canAct} onClick={m.reviewDispatch}>
              Review Dispatch
            </GameButton>
          </TaskHighlight>
        ) : !d.dispatchSent ? (
          <TaskHighlight active={highlight === "dispatch"}>
            <GameButton className="w-full" onClick={m.sendDispatch}>
              <Send className="size-4" aria-hidden="true" /> Send Dispatch to Driver
            </GameButton>
          </TaskHighlight>
        ) : null}
        {!canAct && <p className="text-center text-[11px] text-ink-dim">{run.started ? "Select a driver first." : "Start the mission first."}</p>}
      </div>
    </section>
  );
}
