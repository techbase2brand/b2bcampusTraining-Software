"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAccess } from "@/hooks/useRequireAccess";
import { resolveLegacyRoute } from "@/lib/dispatchRecords";

// Old bookmarks (/dispatcher/brokers ...) and sidebar links land here and are sent on, never to a
// blank page.
export default function LegacyRouteRedirect({ kind }) {
  const router = useRouter();
  const { state, allowed } = useRequireAccess();
  const target = allowed ? resolveLegacyRoute(state, kind) : null;

  useEffect(() => {
    if (target) router.replace(target);
  }, [target, router]);

  return (
    <main className="game-backdrop grid min-h-screen place-items-center p-6">
      <p className="text-sm text-ink-dim">Opening your dispatch...</p>
    </main>
  );
}
