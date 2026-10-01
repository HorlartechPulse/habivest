"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, formatNaira } from "@/lib/api";

export default function LandlordDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    properties: number;
    published: number;
    applications: number;
    activeLeases: number;
    rentCollected: number;
  } | null>(null);

  useEffect(() => {
    api<{ data: typeof stats }>("/analytics/summary", {}, true)
      .then((r) => setStats(r.data))
      .catch(() => {
        clearToken();
        router.push("/login");
      });
  }, [router]);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-forest">Landlord portfolio</h1>
      <p className="text-sm text-muted mt-1">
        Aggregated metrics · mock payments · fictional data
      </p>
      {stats && (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            ["Properties", stats.properties],
            ["Published", stats.published],
            ["Applications", stats.applications],
            ["Active leases", stats.activeLeases],
            ["Rent collected", formatNaira(stats.rentCollected)],
          ].map(([l, v]) => (
            <div key={String(l)} className="bg-white border border-line rounded-xl p-5">
              <p className="text-sm text-muted">{l}</p>
              <p className="text-xl font-bold mt-1">{v}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
