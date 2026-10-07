import { Suspense } from "react";
import BrokersPage from "@/components/brokers/BrokersPage";

export const metadata = { title: "Brokers | B2B Logistics" };

export default function Page() {
  // useSearchParams (dev preview flag) requires a Suspense boundary.
  return (
    <Suspense fallback={<main className="game-backdrop min-h-screen" />}>
      <BrokersPage />
    </Suspense>
  );
}
