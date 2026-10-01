"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, clearToken } from "@/lib/api";

export default function TenantDashboard() {
  const router = useRouter();
  const [apps, setApps] = useState<
    { id: string; status: string; property: { title: string; slug: string } }[]
  >([]);

  useEffect(() => {
    api<{ data: typeof apps }>("/applications/me", {}, true)
      .then((r) => setApps(r.data))
      .catch(() => {
        clearToken();
        router.push("/login");
      });
  }, [router]);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-forest">Your applications</h1>
        <Link href="/properties" className="text-sm text-emerald-700">
          Browse
        </Link>
      </div>
      <ul className="mt-6 space-y-3">
        {apps.map((a) => (
          <li key={a.id} className="bg-white border border-line rounded-xl p-4 text-sm">
            <p className="font-medium">{a.property.title}</p>
            <p className="text-muted">{a.status}</p>
          </li>
        ))}
        {apps.length === 0 && (
          <p className="text-sm text-muted">No applications yet</p>
        )}
      </ul>
    </main>
  );
}
