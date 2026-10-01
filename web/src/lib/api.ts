const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4600/api/v1";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hb_token");
}
export function setToken(t: string) {
  localStorage.setItem("hb_token", t);
}
export function clearToken() {
  localStorage.removeItem("hb_token");
}

export async function api<T>(path: string, opts: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
  return json as T;
}

export function formatNaira(n: number | string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(n));
}
