import { Suspense } from "react";
import TrackingPage from "@/components/tracking/TrackingPage";

export const metadata = { title: "Tracking | B2B Logistics" };

export default function Page() {
  // useSearchParams (dev preview flag) requires a Suspense boundary.
  return (
    <Suspense fallback={<main className="game-backdrop min-h-screen" />}>
      <TrackingPage />
    </Suspense>
  );
}
