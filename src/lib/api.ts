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
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  if (!options.skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && hasJsonBody(options.body) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJsonResponse = response.headers.get("content-type")?.includes("application/json");
  const body = isJsonResponse ? await response.json() as Record<string, unknown> : null;

  if (!response.ok) {
    throw new ApiError(
      String(body?.message || body?.error || `Request failed for ${url}`),
      response.status,
      typeof body?.requestId === "string" ? body.requestId : undefined,
    );
  }

  return body as T;
}
