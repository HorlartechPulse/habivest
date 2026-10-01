"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, formatNaira, getToken } from "@/lib/api";

export default function PropertyDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [p, setP] = useState<{
    id: string;
    title: string;
    description: string;
    city: string;
    district?: string;
    bedrooms: number;
    bathrooms: number;
    rentAmount: string;
    depositAmount?: string;
    coverImageUrl?: string;
    isVerified: boolean;
    amenities: { amenity: { name: string } }[];
  } | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ data: typeof p }>(`/properties/${slug}`)
      .then((r) => setP(r.data))
      .catch(console.error);
  }, [slug]);

  const apply = async () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    if (!p) return;
    try {
      await api(
        "/applications",
        {
          method: "POST",
          body: JSON.stringify({
            propertyId: p.id,
            message: "I would like to apply (demo).",
          }),
        },
        true
      );
      setMsg("Application submitted");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!p) return <p className="p-10 text-muted text-sm">Loading…</p>;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <Link href="/properties" className="text-sm text-muted">
        ← Properties
      </Link>
      <div
        className="mt-4 aspect-[21/9] rounded-2xl bg-slate-200 bg-cover bg-center"
        style={
          p.coverImageUrl
            ? { backgroundImage: `url(${p.coverImageUrl})` }
            : undefined
        }
      />
      <h1 className="mt-6 text-3xl font-bold text-forest">{p.title}</h1>
      <p className="text-muted mt-1">
        {p.district ? `${p.district}, ` : ""}
        {p.city}
      </p>
      <p className="mt-3 text-2xl font-semibold">
        {formatNaira(p.rentAmount)}
        <span className="text-sm font-normal text-muted"> / year</span>
      </p>
      <p className="text-sm text-muted mt-1">
        {p.bedrooms} beds · {p.bathrooms} baths
        {p.depositAmount ? ` · Deposit ${formatNaira(p.depositAmount)}` : ""}
      </p>
      {p.isVerified && (
        <p className="mt-2 text-xs text-emerald-700 font-medium">
          Platform verified (not a government certificate)
        </p>
      )}
      <p className="mt-6 text-sm leading-relaxed whitespace-pre-wrap">{p.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {p.amenities?.map((a) => (
          <span
            key={a.amenity.name}
            className="text-xs px-2 py-1 border border-line rounded-full"
          >
            {a.amenity.name}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={apply}
        className="mt-8 px-6 py-3 bg-forest text-white rounded-lg text-sm font-semibold"
      >
        Apply to rent
      </button>
      {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}
    </main>
  );
}
