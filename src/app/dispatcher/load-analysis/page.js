import { Suspense } from "react";
import LoadAnalysisPage from "@/components/analysis/LoadAnalysisPage";

export const metadata = { title: "Load Analysis | B2B Logistics" };

export default function Page() {
  // useSearchParams (dev preview flag) requires a Suspense boundary.
  return (
    <Suspense fallback={<main className="game-backdrop min-h-screen" />}>
      <LoadAnalysisPage />
    </Suspense>
  );
}
