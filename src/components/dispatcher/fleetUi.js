import { Container, Snowflake, Layers, Box, Truck } from "lucide-react";

// Shared look for the Trucks page: status pills and equipment badges. Pure presentation.

export const STATUS_PILL = {
  Available: "app-border-success bg-success/10 text-success",
  "On Load": "app-border-active bg-cyan/10 text-cyan-bright",
  "In Maintenance": "app-border-warning bg-gold/10 text-gold-bright",
  Unavailable: "app-border-error bg-danger/10 text-danger",
};
export const STATUS_DOT = {
  Available: "bg-success",
  "On Load": "bg-cyan-bright",
  "In Maintenance": "bg-gold-bright",
  Unavailable: "bg-danger",
};

export function StatusPill({ status, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full app-border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${STATUS_PILL[status] ?? " text-ink-dim"} ${className}`}>
      <span className={`size-1.5 rounded-full ${STATUS_DOT[status] ?? "bg-ink-dim"}`} aria-hidden="true" />
      {status}
    </span>
  );
}

// Equipment: an icon, a tint for the photo overlay and a different crop of the shared truck photo,
// so cards differ even though only one image exists. Unknown equipment falls back to a plain truck.
const EQUIPMENT = {
  "Dry Van": { Icon: Container, tint: "from-cyan/25", pos: "22% 60%" },
  Reefer: { Icon: Snowflake, tint: "from-blue/30", pos: "70% 55%" },
  Flatbed: { Icon: Layers, tint: "from-gold/25", pos: "40% 70%" },
  "Step Deck": { Icon: Layers, tint: "from-[#9b8cff]/30", pos: "85% 62%" },
  "Box Truck": { Icon: Box, tint: "from-success/25", pos: "10% 52%" },
};
export const equipmentLook = (equipment) => EQUIPMENT[equipment] ?? { Icon: Truck, tint: "from-cyan/20", pos: "22% 60%" };

export function EquipmentBadge({ equipment, className = "" }) {
  const { Icon } = equipmentLook(equipment);
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md app-border app-border-subtle bg-navy-950/70 px-1.5 py-0.5 text-[11px] font-semibold text-ink backdrop-blur ${className}`}>
      <Icon className="size-3.5 text-cyan-bright" aria-hidden="true" />
      {equipment}
    </span>
  );
}
