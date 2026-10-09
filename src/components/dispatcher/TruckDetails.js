import { MapPin, UserRound, Route, Wrench, CheckCircle2, ArrowRight, Gauge } from "lucide-react";
import GameButton from "@/components/game/GameButton";
import GameImage from "@/components/game/GameImage";
import StatusBadge from "@/components/dashboard/StatusBadge";
import { formatHos } from "@/lib/format";
import { StatusPill, EquipmentBadge, equipmentLook } from "./fleetUi";

function Field({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-xs text-ink-dim">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

// Body of the truck details drawer. All values come from the fleet row (truck, driver, dispatch);
// fields the data does not have (maintenance reason, recent activity) are simply not shown.
export default function TruckDetails({ row, onOpenProfile, onViewDispatch }) {
  const { truck, driver, status, dispatch, driverFlag } = row;
  const look = equipmentLook(truck.equipment);

  return (
    <>
      <div className="relative h-32 overflow-hidden rounded-xl app-border app-border-subtle">
        <GameImage src="/images/login-truck.png" alt="" position={look.pos} sizes="480px" className="absolute inset-0" fallback={<div className="absolute inset-0 bg-linear-to-br from-surface-2 to-navy-900" />} />
        <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${look.tint} via-transparent to-navy-950/70`} aria-hidden="true" />
        <EquipmentBadge equipment={truck.equipment} className="absolute left-2 top-2" />
        <StatusPill status={status} className="absolute right-2 top-2 bg-navy-950/80" />
      </div>

      {status === "Available" && !dispatch && (
        <p className="flex items-center gap-2 rounded-xl app-border app-border-success bg-success/10 px-3 py-2 text-sm font-bold text-success">
          <CheckCircle2 className="size-4" aria-hidden="true" /> AVAILABLE FOR DISPATCH
        </p>
      )}
      {status === "In Maintenance" && (
        <p className="flex items-center gap-2 rounded-xl app-border app-border-warning bg-gold/10 px-3 py-2 text-sm font-bold text-gold-bright">
          <Wrench className="size-4" aria-hidden="true" /> IN MAINTENANCE
        </p>
      )}

      {dispatch && (
        <section aria-label="Current dispatch" className="liquid-border liquid-border-subtle rounded-xl app-border bg-navy-900/60 p-3">
          <h3 className="label-xs flex items-center gap-1.5">
            <Route className="size-3.5" aria-hidden="true" /> Current dispatch
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-ink">{dispatch.label}</p>
            <StatusBadge statusId={dispatch.statusId} label={dispatch.statusLabel} />
          </div>
          {dispatch.reference && <p className="mt-1 text-xs text-ink-dim">{dispatch.reference}</p>}
          {dispatch.route && <p className="text-sm font-semibold text-ink">{dispatch.route}</p>}
          <GameButton size="sm" className="mt-2" onClick={() => onViewDispatch(dispatch.resumeRoute)}>
            View Dispatch <ArrowRight className="size-3.5" aria-hidden="true" />
          </GameButton>
        </section>
      )}

      <section aria-label="Truck" className="rounded-xl app-border bg-navy-900/60 px-3">
        <h3 className="label-xs pt-2.5">Truck</h3>
        <dl className="divide-y divide-line/50">
          <Field label="Truck ID">{truck.id}</Field>
          <Field label="Model">{truck.model}</Field>
          <Field label="Equipment">{truck.equipment}</Field>
          <Field label="Trailer">{truck.trailer}</Field>
          <Field label="Capacity">{truck.capacity}</Field>
          <Field label="Location">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5 text-cyan-bright" aria-hidden="true" /> {truck.location}
            </span>
          </Field>
          <Field label="Availability">{status}</Field>
        </dl>
      </section>

      <section aria-label="Assigned driver" className="rounded-xl app-border bg-navy-900/60 px-3">
        <h3 className="label-xs pt-2.5">Assigned driver</h3>
        {driver ? (
          <dl className="divide-y divide-line/50">
            <Field label="Driver">
              <span className="inline-flex items-center gap-1">
                <UserRound className="size-3.5 text-cyan-bright" aria-hidden="true" /> {driver.name}
              </span>
            </Field>
            <Field label="Driver ID">{driver.id}</Field>
            <Field label="Duty status">{driver.dutyStatus}</Field>
            <Field label="Remaining HOS">
              <span className="inline-flex items-center gap-1">
                <Gauge className="size-3.5 text-cyan-bright" aria-hidden="true" /> {formatHos(driver.hosMinutes)}
              </span>
            </Field>
            <Field label="Driver availability">
              {driver.availability}
              {driverFlag && <span className="ml-1.5 text-[11px] font-semibold text-gold-bright">({driverFlag})</span>}
            </Field>
          </dl>
        ) : (
          <p className="py-2 text-sm text-ink-dim">No driver assigned.</p>
        )}
      </section>

      <GameButton variant="ghost" className="w-full" onClick={() => onOpenProfile(truck.id)}>
        Open full truck profile <ArrowRight className="size-4" aria-hidden="true" />
      </GameButton>
    </>
  );
}
