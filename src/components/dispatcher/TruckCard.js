import { MapPin, UserRound, ArrowRight, Route, Wrench } from "lucide-react";
import GameImage from "@/components/game/GameImage";
import { StatusPill, EquipmentBadge, equipmentLook } from "./fleetUi";

// One truck in the fleet grid. The whole card opens the details drawer (an overlay button, so the
// footer action stays a separate, real button). Only the selected card gets the strong edge.
export default function TruckCard({ row, selected, onOpen, onViewDispatch }) {
  const { truck, driver, status, dispatch, driverFlag } = row;
  const look = equipmentLook(truck.equipment);
  const maintenance = status === "In Maintenance";

  return (
    <article
      className={`group relative flex flex-col rounded-2xl app-border bg-surface/80 shadow-[0_10px_30px_rgb(0_0_0/0.25)] transition duration-200 hover:-translate-y-0.5 ${
        selected ? "liquid-border liquid-border-strong" : "liquid-border liquid-border-subtle"
      }`}
    >
      <button type="button" onClick={() => onOpen(truck.id)} aria-label={`Open ${truck.id} details`} aria-pressed={selected} className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:outline-2 focus-visible:outline-cyan-bright" />

      <div className="relative h-24 overflow-hidden rounded-t-2xl">
        <GameImage
          src="/images/login-truck.png"
          alt=""
          position={look.pos}
          sizes="360px"
          className={`absolute inset-0 transition duration-300 group-hover:scale-[1.03] group-hover:brightness-110 ${maintenance ? "saturate-50" : ""}`}
          fallback={<div className="absolute inset-0 bg-linear-to-br from-surface-2 to-navy-900" />}
        />
        <div className={`pointer-events-none absolute inset-0 bg-linear-to-br ${look.tint} via-transparent to-navy-950/70`} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-surface/90 to-transparent" aria-hidden="true" />
        <EquipmentBadge equipment={truck.equipment} className="absolute left-2 top-2" />
        <StatusPill status={status} className="absolute right-2 top-2 bg-navy-950/80 backdrop-blur" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="text-base font-extrabold leading-tight text-ink">{truck.id}</h3>
          <p className="truncate text-xs text-ink-dim">{truck.model}</p>
        </div>
        <ul className="space-y-1 text-sm text-ink-dim">
          <li className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-cyan-bright" aria-hidden="true" />
            <span className="truncate text-ink">{truck.location}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <UserRound className="size-3.5 shrink-0 text-cyan-bright" aria-hidden="true" />
            <span className="truncate text-ink">{driver?.name ?? "No driver"}</span>
            {driverFlag && <span className="shrink-0 rounded bg-gold/10 px-1 text-[11px] font-semibold text-gold-bright">{driverFlag}</span>}
          </li>
        </ul>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-line/60 pt-2">
          {dispatch ? (
            <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-cyan-bright">
              <Route className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{dispatch.label}</span>
            </p>
          ) : maintenance ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-bright">
              <Wrench className="size-3.5" aria-hidden="true" /> In maintenance
            </p>
          ) : (
            <p className="text-xs font-semibold text-ink-dim">{status === "Available" ? "Available for dispatch" : status}</p>
          )}
          {dispatch ? (
            <button type="button" onClick={() => onViewDispatch(dispatch.resumeRoute)} className="relative z-20 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-bold text-cyan-bright hover:underline">
              View Dispatch <ArrowRight className="size-3.5" aria-hidden="true" />
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-cyan-bright transition group-hover:translate-x-0.5">
              View Truck <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
