import DispatchPage from "@/components/dispatch/DispatchPage";

export const metadata = { title: "Dispatch | B2B Logistics" };

// /dispatcher/dispatch/[dispatchSlug]: the dispatch is resolved from the slug by the page itself.
export default function Page() {
  return <DispatchPage />;
}
