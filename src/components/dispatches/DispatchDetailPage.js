"use client";

import { useParams, useRouter } from "next/navigation";
import { Plus, LayoutDashboard, List } from "lucide-react";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { getDispatchBySlug, ROUTES } from "@/lib/dispatchRecords";
import { describeDispatch } from "@/lib/dispatchView";
import { getDispatchActivity } from "@/lib/dashboardStats";
import { getPracticeSummary } from "@/lib/practiceAttempts";
import { projectDispatchState } from "@/lib/dispatchRecords";
import { formatCurrency } from "@/lib/text";
import DispatcherLayout from "@/components/dispatcher/DispatcherLayout";
import GameButton from "@/components/game/GameButton";
import StatusBadge from "@/components/dashboard/StatusBadge";
import DispatchNotFound from "./DispatchNotFound";

const fmt = (iso) => (iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "-");

function Fact({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="label-xs">{label}</dt>
      <dd className="truncate text-sm font-semibold text-ink">{children ?? "-"}</dd>
    </div>
  );
}

// Read-only summary of one dispatch (the target for completed dispatches, also fine for any other).
export default function DispatchDetailPage() {
  const { dispatchSlug } = useParams();
  const router = useRouter();
  const { state, allowed } = useRequireAccess();
  if (!allowed) return <main className="game-backdrop min-h-screen" />;
  const record = getDispatchBySlug(state, dispatchSlug);
  if (!record) return <DispatchNotFound slug={dispatchSlug} />;

  const d = describeDispatch(record);
  const activity = getDispatchActivity(state, record);
  const practice = getPracticeSummary(projectDispatchState(state, record));

  return (
    <DispatcherLayout activeId="dispatches">
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-extrabold text-ink sm:text-2xl">{d.label}</h1>
          <StatusBadge statusId={d.statusId} label={d.statusLabel} />
          <span className="text-xs text-ink-dim">{d.completed ? "Completed, read-only" : d.stageLabel}</span>
          {!d.completed && (
            <GameButton size="sm" className="ml-auto" onClick={() => router.push(d.resumeRoute)}>
              Resume
            </GameButton>
          )}
        </header>

        <section className="panel p-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Fact label="Load">{d.reference}</Fact>
            <Fact label="Route">{d.route}</Fact>
            <Fact label="Broker">{d.brokerName}</Fact>
            <Fact label="Agreed rate">{d.agreedRate != null ? formatCurrency(d.agreedRate) : null}</Fact>
            <Fact label="Posted rate">{d.postedRate != null ? formatCurrency(d.postedRate) : null}</Fact>
            <Fact label="Driver">{d.driverName}</Fact>
            <Fact label="Truck">{d.truckId}</Fact>
            <Fact label="Created">{fmt(d.createdAt)}</Fact>
            <Fact label="Completed">{fmt(d.completedAt)}</Fact>
            <Fact label="Loads compared">{practice.loadsCompared || record.ops.shortlistedLoadIds.length}</Fact>
            <Fact label="Broker conversations">{practice.brokerConversations}</Fact>
            <Fact label="Negotiated deals">{practice.negotiatedDeals}</Fact>
          </dl>
        </section>

        <section className="panel p-4">
          <h2 className="panel-title">Activity</h2>
          <ul className="mt-2 space-y-1.5">
            {activity.map((e) => (
              <li key={e.id} className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2 border-b border-line/40 pb-1.5 text-xs last:border-0">
                <span className="tabular-nums text-ink-dim">{e.time ?? ""}</span>
                <span className="text-ink">{e.message}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-2">
          <GameButton onClick={() => router.push(ROUTES.board)}>
            <Plus className="size-4" aria-hidden="true" /> Start New Dispatch
          </GameButton>
          <GameButton variant="ghost" onClick={() => router.push(ROUTES.hub)}>
            <List className="size-4" aria-hidden="true" /> Dispatch History
          </GameButton>
          <GameButton variant="ghost" onClick={() => router.push("/dispatcher")}>
            <LayoutDashboard className="size-4" aria-hidden="true" /> Return to Dashboard
          </GameButton>
        </div>
      </div>
    </DispatcherLayout>
  );
}
