import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-line bg-forest text-white">
        <div className="absolute inset-0 opacity-35">
          <Image
            src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1800&q=80"
            alt="Modern apartment interior"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-forest via-forest/90 to-forest/40" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-sage">
              Property &amp; rentals
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Find a place.
              <br />
              Build a life.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-emerald-100">
              Discover rentals, schedule viewings, apply, manage leases, and pay rent — a full
              lifecycle platform for seekers, tenants, and landlords.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/properties"
                className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-forest"
              >
                Browse properties
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-6 text-xs text-emerald-200/80">
              Portfolio demo · Fictional listings · Not a licensed broker
            </p>
          </div>
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-2xl border border-white/20 shadow-2xl md:block">
            <Image
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80"
              alt="Contemporary home exterior"
              fill
              className="object-cover"
              sizes="50vw"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3">
          {[
            ["Search & filter", "City, bedrooms, price, property type, and amenities."],
            ["Apply & lease", "Applications, status history, and active lease records."],
            ["Rent & upkeep", "Mock rent payments with ledger entries and maintenance tickets."],
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="font-bold text-forest">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-forest">Featured destinations</h2>
            <p className="mt-1 text-sm text-muted">Explore demo inventory across major cities</p>
          </div>
          <Link href="/properties" className="text-sm font-semibold text-forest">
            View all listings →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              city: "Lagos",
              img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            },
            {
              city: "Abuja",
              img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
            },
            {
              city: "Ibadan",
              img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
            },
          ].map((c) => (
            <Link
              key={c.city}
              href={`/properties?city=${c.city}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
            >
              <Image
                src={c.img}
                alt={c.city}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width:768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest/80 to-transparent" />
              <span className="absolute bottom-4 left-4 text-lg font-bold text-white">
                {c.city}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
