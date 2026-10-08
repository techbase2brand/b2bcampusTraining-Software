import TrackingPage from "@/components/tracking/TrackingPage";

export const metadata = { title: "Tracking | B2B Logistics" };

// /dispatcher/tracking/[dispatchSlug]: the dispatch is resolved from the slug by the page itself.
export default function Page() {
  return <TrackingPage />;
}
