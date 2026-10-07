import { ArrowLeft } from "lucide-react";
import { trucks } from "@/data/trucks";
import { drivers } from "@/data/drivers";
import GameButton from "@/components/game/GameButton";
import TruckThumb from "./TruckThumb";
import TaskHighlight from "./TaskHighlight";
import { truckStatusStyle } from "./TruckList";

export default function TruckProfile({ truckId, onBack, onOpenDriver, onConfirmEquipment, highlight, confirming }) {
  const truck = trucks.find((t) => t.id === truckId);
  const driver = drivers.find((d) => d.id === truck.driverId);

  const rows = [
    ["Truck ID", truck.id],
    ["Equipment Type", truck.equipment],
    ["Trailer Type", truck.trailer],
    ["Location", truck.location],
    ["Capacity", truck.capacity],
  ];

  return (
    <div>
      <GameButton variant="ghost" onClick={onBack}>
        <ArrowLeft className="size-4" aria-hidden="true" /> All Trucks
      </GameButton>
      <div className="mt-5 flex items-center gap-4">
        <TruckThumb className="h-20 w-32 shrink-0 rounded-xl" />
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{truck.id}</h1>
          <p className="text-sm text-ink-dim">{truck.model}</p>
        </div>
      </div>

      <dl className="mt-5 max-w-xl divide-y divide-line/60 rounded-2xl border border-line bg-surface px-5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3">
            <dt className="text-sm text-ink-dim">{label}</dt>
            <dd className="text-sm font-semibold text-ink">{value}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-sm text-ink-dim">Availability</dt>
          <dd>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${truckStatusStyle[truck.status]}`}>
              {truck.status}
            </span>
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-3">
          <dt className="text-sm text-ink-dim">Assigned Driver</dt>
          <dd>
            <TaskHighlight active={highlight === "assigned-driver"}>
              <button
                type="button"
                onClick={() => onOpenDriver(driver.id)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-cyan-bright hover:underline"
              >
                {driver.name}
              </button>
            </TaskHighlight>
          </dd>
        </div>
      </dl>

      {confirming && (
        <TaskHighlight active={highlight === "truck-confirm"} className="mt-5 inline-block">
          <GameButton variant="cyan" onClick={() => onConfirmEquipment(truck.id)}>
            Confirm: this is the Dry Van truck
          </GameButton>
        </TaskHighlight>
      )}
    </div>
  );
}
