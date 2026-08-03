import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { TOKEN_KEY } from "../services/api";
import * as authApi from "../services/authApi";
import { getEnabledFeatures } from "../services/featureFlagsApi";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username?: string
  ) => Promise<void>;
  logout: () => void;
  hasFeature: (key: string) => boolean;
}

// `undefined` default lets useAuth() detect "used outside the provider".
const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage so a refresh keeps you logged in.
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );
  const [features, setFeatures] = useState<string[]>([]);

  // Re-fetch on every token change: covers both a fresh login and a page
  // reload where the token already existed in localStorage. Clearing
  // features on logout happens in persist() below, not here — an early
  // synchronous setState in an effect body triggers a cascading re-render.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getEnabledFeatures()
      .then((keys) => {
        if (!cancelled) setFeatures(keys);
      })
      .catch(() => {
        // Non-critical — worst case the beta tab/routes stay hidden.
        if (!cancelled) setFeatures([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const persist = (value: string | null) => {
    if (value) {
      localStorage.setItem(TOKEN_KEY, value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setFeatures([]);
    }
    setToken(value);
  };

  const login = async (identifier: string, password: string) => {
    const { access_token } = await authApi.login(identifier, password);
    persist(access_token);
  };

  const register = async (
    email: string,
    password: string,
    username?: string
  ) => {
    const { access_token } = await authApi.register(
      email,
      password,
      username
    );
    persist(access_token);
  };

  const logout = () => persist(null);

  const hasFeature = (key: string) => features.includes(key);

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: Boolean(token),
        login,
        register,
        logout,
        hasFeature,
      }}
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