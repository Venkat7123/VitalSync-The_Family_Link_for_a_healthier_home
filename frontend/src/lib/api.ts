const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080/api";

// ─── Token helpers ────────────────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vs_token");
}

export function setToken(token: string): void {
  localStorage.setItem("vs_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("vs_token");
  localStorage.removeItem("vs_user");
}

export function getUser(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("vs_user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setUser(user: unknown): void {
  localStorage.setItem("vs_user", JSON.stringify(user));
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
type FetchOptions = RequestInit & { requireAuth?: boolean };

export async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { requireAuth = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers || {});

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  if (
    fetchOptions.body &&
    !(fetchOptions.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_BASE_URL}${endpoint}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network error calling ${url}: ${message}`);
  }

  if (!response.ok) {
    let errorText = "";
    try { errorText = await response.text(); } catch {}
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export async function apiLogin(email: string, password: string) {
  const data = await fetchApi("/auth/login", {
    method: "POST",
    requireAuth: false,
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  setUser({ userId: data.userId, email: data.email, role: data.role, fullName: data.fullName });
  return data;
}

export async function apiRegister(payload: {
  email: string;
  password: string;
  fullName: string;
  role: string;
  pairCode?: string;
}) {
  const data = await fetchApi("/auth/register", {
    method: "POST",
    requireAuth: false,
    body: JSON.stringify(payload),
  });
  setToken(data.token);
  setUser({ userId: data.userId, email: data.email, role: data.role, fullName: data.fullName });
  return data;
}

export async function apiLogout() {
  const token = getToken();
  if (token) {
    try {
      await fetchApi("/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
  clearToken();
}
