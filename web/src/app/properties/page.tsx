"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { api, formatNaira } from "@/lib/api";

type Property = {
  id: string;
  title: string;
  slug: string;
  city: string;
  district?: string;
  bedrooms: number;
  bathrooms: number;
  rentAmount: string;
  coverImageUrl?: string;
  isVerified: boolean;
  propertyType: string;
};

const FALLBACK =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80";

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Property[]>([]);
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [error, setError] = useState("");

  const load = (c = "") => {
    const qs = c ? `?city=${encodeURIComponent(c)}` : "";
    api<{ data: Property[] }>(`/properties${qs}`)
      .then((r) => setItems(r.data))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load(city);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-forest">Properties for rent</h1>
      <p className="mt-1 text-sm text-muted">Search the live Habivest API inventory</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          className="max-w-xs flex-1 rounded-lg border border-line px-3 py-2 text-sm"
          placeholder="City (e.g. Lagos)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button
          type="button"
          onClick={() => load(city)}
          className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          Search
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/properties/${p.slug}`}
            className="group overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-[16/11] bg-slate-100">
              <Image
                src={p.coverImageUrl || FALLBACK}
                alt={p.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 33vw"
              />
              {p.isVerified && (
                <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Verified
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sage">
                {p.propertyType} · {p.city}
                {p.district ? `, ${p.district}` : ""}
              </p>
              <h2 className="mt-1 font-bold text-forest group-hover:text-emerald-800">
                {p.title}
              </h2>
              <p className="mt-2 text-sm font-semibold text-ink">
                {formatNaira(p.rentAmount)}
                <span className="font-normal text-muted"> / year</span>
              </p>
              <p className="mt-1 text-xs text-muted">
                {p.bedrooms} bed · {p.bathrooms} bath
              </p>
            </div>
          </Link>
        ))}
      </div>
      {items.length === 0 && !error && (
        <p className="mt-8 text-sm text-muted">No listings. Start the API and run the seed.</p>
      )}
    </main>
  );
}
