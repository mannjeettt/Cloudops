import { useContext } from "react";

import { AuthContext, type AuthUser } from "@/hooks/auth-context";

export type { AuthUser };

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
