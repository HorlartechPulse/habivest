"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("tenant@habivest.test");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api<{
        data: { accessToken: string; user: { role: string } };
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.data.accessToken);
      const r = res.data.user.role;
      if (r === "LANDLORD" || r === "PROPERTY_OWNER" || r === "AGENT") {
        router.push("/landlord");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-white border border-line rounded-2xl p-8"
      >
        <Link href="/" className="font-bold text-forest">
          Habivest
        </Link>
        <h1 className="text-xl font-bold mt-4 mb-6">Sign in</h1>
        <label className="text-sm font-medium">Email</label>
        <input
          className="mt-1 mb-3 w-full px-3 py-2.5 border border-line rounded-lg text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <label className="text-sm font-medium">Password</label>
        <input
          className="mt-1 mb-4 w-full px-3 py-2.5 border border-line rounded-lg text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
        />
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-forest text-white rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-xs text-muted">
          tenant@ · landlord@ · agent@ · admin@habivest.test · ChangeMe123!
        </p>
      </form>
    </div>
  );
}
