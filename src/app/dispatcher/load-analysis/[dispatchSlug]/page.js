import LoadAnalysisPage from "@/components/analysis/LoadAnalysisPage";

export const metadata = { title: "Load Analysis | B2B Logistics" };

// /dispatcher/load-analysis/[dispatchSlug]: the dispatch is resolved from the slug by the page itself.
export default function Page() {
  return <LoadAnalysisPage />;
}
