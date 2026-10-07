import { Suspense } from "react";
import LoadBoardPage from "@/components/loadboard/LoadBoardPage";

export const metadata = { title: "Load Board | B2B Logistics" };

export default function Page() {
  // useSearchParams (dev preview flag) requires a Suspense boundary.
  return (
    <Suspense fallback={<main className="game-backdrop min-h-screen" />}>
      <LoadBoardPage />
    </Suspense>
  );
}
