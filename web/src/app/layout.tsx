import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Habivest — Find a place. Build a life.",
    template: "%s | Habivest",
  },
  description:
    "Property discovery and rental management platform — listings, applications, leases, and rent payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-surface text-slate-900 antialiased`}>
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-forest">
              Habivest
            </Link>
            <nav className="flex items-center gap-5 text-sm text-muted">
              <Link href="/properties" className="hover:text-forest">
                Properties
              </Link>
              <Link href="/dashboard" className="hover:text-forest">
                Dashboard
              </Link>
              <Link href="/landlord" className="hover:text-forest">
                Landlord
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-forest px-3 py-1.5 text-xs font-semibold text-white"
              >
                Sign in
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-20 border-t border-line bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-10 text-sm text-muted md:flex-row md:justify-between">
            <p className="font-bold text-forest">Habivest</p>
            <p>Property &amp; rental management · Next.js · Express · MySQL</p>
            <p>© {new Date().getFullYear()} · Abdulwaheed Toheeb Olanrewaju</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
