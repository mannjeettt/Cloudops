import { createContext } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
