import BrokersPage from "@/components/brokers/BrokersPage";

export const metadata = { title: "Brokers | B2B Logistics" };

// /dispatcher/brokers/[dispatchSlug]: the dispatch is resolved from the slug by the page itself.
export default function Page() {
  return <BrokersPage />;
}
