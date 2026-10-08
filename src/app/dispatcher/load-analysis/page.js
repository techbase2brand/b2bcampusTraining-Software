import LegacyRouteRedirect from "@/components/dispatches/LegacyRouteRedirect";

export const metadata = { title: "Load Analysis | B2B Logistics" };

// Old non-slug URL: sends the student to the matching dispatch, the Dispatches page, or the Load Board.
export default function Page() {
  return <LegacyRouteRedirect kind="analysis" />;
}
