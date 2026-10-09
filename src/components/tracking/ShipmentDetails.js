"use client";

import { formatCurrency } from "@/lib/text";
import { formatLocation } from "@/lib/loadSelectors";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/40 py-2 last:border-0">
      <dt className="text-sm text-ink-dim">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

// Full shipment details (drawer content). Everything is resolved from the load, broker, driver,
// truck and the tracker's own miles; nothing is stored separately.
export default function ShipmentDetails({ m }) {
  const { load, broker, entry, tl, agreedRate } = m;
  const requirements = load.specialRequirements.length ? load.specialRequirements.join(", ") : "None";
  return (
    <dl className="rounded-xl app-border bg-surface px-4">
      <Row label="Load ID">{load.referenceNumber}</Row>
      <Row label="Broker">{broker.name}</Row>
      <Row label="Agreed rate">{formatCurrency(agreedRate)}</Row>
      <Row label="Driver">{entry.driver.name}</Row>
      <Row label="Truck">{entry.truck.id}</Row>
      <Row label="Equipment">{load.equipmentType}</Row>
      <Row label="Weight">{load.weight.toLocaleString("en-US")} lbs</Row>
      <Row label="Commodity">{load.commodity}</Row>
      <Row label="Pickup">
        {formatLocation(load.originLocationId)}
        <br />
        {m.fmt(new Date(load.pickupWindow.start))} - {m.fmt(new Date(load.pickupWindow.end))}
      </Row>
      <Row label="Delivery">
        {formatLocation(load.destinationLocationId)}
        <br />
        {m.fmt(new Date(load.deliveryWindow.start))} - {m.fmt(new Date(load.deliveryWindow.end))}
      </Row>
      <Row label="Appointment">{load.appointmentType}</Row>
      <Row label="Special requirements">{requirements}</Row>
      <Row label="Deadhead">{tl.deadhead.toLocaleString("en-US")} mi</Row>
      <Row label="Loaded miles">{tl.loadedMiles.toLocaleString("en-US")} mi</Row>
      <Row label="Total miles">{(tl.deadhead + tl.loadedMiles).toLocaleString("en-US")} mi</Row>
    </dl>
  );
}
