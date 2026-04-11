import type { AuthUser } from "@/hooks/use-auth";

export const isAuthRequired = import.meta.env.VITE_REQUIRE_AUTH === "true";

export const demoAuthUser: AuthUser = {
  id: "demo-user",
  email: "admin@cloudops.io",
  name: "Demo Admin",
  role: "admin",
};

export const demoAuthToken = "demo-session-token";
