import { getAuthToken } from "@/lib/auth-token";

export const REFRESH_INTERVAL_MS = 5000;

export class ApiError extends Error {
  status: number;

  requestId?: string;

  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
  }
}

interface FetchJsonOptions extends RequestInit {
  skipAuth?: boolean;
}

const hasJsonBody = (body: BodyInit | null | undefined): body is string =>
  typeof body === "string";

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const API_BASE = (import.meta.env.VITE_API_URL as string) || "";
  const isAbsolute = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
  const fullUrl = isAbsolute.test(url)
    ? url
    : API_BASE
    ? `${API_BASE.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`
    : url;
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!options.skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && hasJsonBody(options.body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  const isJsonResponse = response.headers.get("content-type")?.includes("application/json");
  const body = isJsonResponse ? await response.json() as Record<string, unknown> : null;

  if (!response.ok) {
    throw new ApiError(
      String(body?.message || body?.error || `Request failed for ${fullUrl}`),
      response.status,
      typeof body?.requestId === "string" ? body.requestId : undefined,
    );
  }

  return body as T;
}
