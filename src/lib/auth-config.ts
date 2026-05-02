import type { AuthUser } from "@/hooks/auth-context";

export const isAuthRequired = import.meta.env.VITE_REQUIRE_AUTH !== "false";

export const demoAuthUser: AuthUser = {
  id: "demo-user",
  email: "admin@cloudops.io",
  name: "Demo Admin",
  role: "admin",
};

let demoAuthToken: string | null = null;

export function getDemoAuthToken(): string {
  if (!demoAuthToken) {
    demoAuthToken = `demo-session-${crypto.randomUUID()}`;
  }

  return demoAuthToken;
}
