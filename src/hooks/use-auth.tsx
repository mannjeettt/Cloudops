import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { fetchJson } from "@/lib/api";
import { demoAuthToken, demoAuthUser, isAuthRequired } from "@/lib/auth-config";
import { setAuthToken, getStoredAuthToken } from "@/lib/auth-token";
import { queryClient } from "@/lib/query-client";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(isAuthRequired ? null : demoAuthUser);
  const [token, setToken] = useState<string | null>(() => {
    if (!isAuthRequired) {
      return demoAuthToken;
    }

    return getStoredAuthToken();
  });
  const [isBootstrapping, setIsBootstrapping] = useState(isAuthRequired);

  const logout = () => {
    if (!isAuthRequired) {
      setUser(demoAuthUser);
      setToken(demoAuthToken);
      return;
    }

    setAuthToken(null);
    setToken(null);
    setUser(null);
    void queryClient.clear();
  };

  const refreshSession = async () => {
    if (!isAuthRequired) {
      setUser(demoAuthUser);
      setToken(demoAuthToken);
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
  };

  useEffect(() => {
    void refreshSession();
  }, []);

  const login = async (email: string, password: string) => {
    if (!isAuthRequired) {
      setUser({
        ...demoAuthUser,
        email: email || demoAuthUser.email,
      });
      setToken(demoAuthToken);
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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
