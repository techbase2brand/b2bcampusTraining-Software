import { Suspense } from "react";
import DispatchPage from "@/components/dispatch/DispatchPage";

export const metadata = { title: "Dispatch | B2B Logistics" };

export default function Page() {
  // useSearchParams (dev preview flag) requires a Suspense boundary.
  return (
    <Suspense fallback={<main className="game-backdrop min-h-screen" />}>
      <DispatchPage />
    </Suspense>
  );
}
