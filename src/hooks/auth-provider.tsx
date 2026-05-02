import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { AuthContext, type AuthResponse, type AuthUser } from "@/hooks/auth-context";
import { fetchJson } from "@/lib/api";
import { demoAuthUser, getDemoAuthToken, isAuthRequired } from "@/lib/auth-config";
import { setAuthToken, getStoredAuthToken } from "@/lib/auth-token";
import { queryClient } from "@/lib/query-client";

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(isAuthRequired ? null : demoAuthUser);
  const [token, setToken] = useState<string | null>(() => {
    if (!isAuthRequired) {
      return getDemoAuthToken();
    }

    return getStoredAuthToken();
  });
  const [isBootstrapping, setIsBootstrapping] = useState(isAuthRequired);

  const logout = useCallback(() => {
    if (!isAuthRequired) {
      setUser(demoAuthUser);
      setToken(getDemoAuthToken());
      return;
    }

    setAuthToken(null);
    setToken(null);
    setUser(null);
    void queryClient.clear();
  }, []);

  const refreshSession = useCallback(async () => {
    if (!isAuthRequired) {
      setUser(demoAuthUser);
      setToken(getDemoAuthToken());
      setIsBootstrapping(false);
      return;
    }

    const activeToken = getStoredAuthToken();
    if (!activeToken) {
      setIsBootstrapping(false);
      return;
    }

    setAuthToken(activeToken);
    setToken(activeToken);

    try {
      const session = await fetchJson<{ user: AuthUser }>("/api/auth/me");
      setUser(session.user);
    } catch {
      logout();
    } finally {
      setIsBootstrapping(false);
    }
  }, [logout]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    if (!isAuthRequired) {
      setUser({
        ...demoAuthUser,
        email: email || demoAuthUser.email,
      });
      setToken(getDemoAuthToken());
      return;
    }

    const response = await fetchJson<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });

    setAuthToken(response.token);
    setToken(response.token);
    setUser(response.user);
    await queryClient.invalidateQueries();
  };

  const updateUser = (nextUser: AuthUser) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isBootstrapping,
        login,
        logout,
        refreshSession,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
