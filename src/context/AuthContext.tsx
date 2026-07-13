import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

import { TOKEN_KEY } from "../services/api";
import * as authApi from "../services/authApi";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// `undefined` default lets useAuth() detect "used outside the provider".
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage so a refresh keeps you logged in.
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const persist = (value: string | null) => {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    setToken(value);
  };

  const login = async (email: string, password: string) => {
    const { access_token } = await authApi.login(email, password);
    persist(access_token);
  };

  const register = async (email: string, password: string) => {
    const { access_token } = await authApi.register(email, password);
    persist(access_token);
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: Boolean(token), login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Small hook so components do `const { login } = useAuth()` without importing
// the context object directly.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}