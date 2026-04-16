"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, ProblemError, setAccessToken } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

interface RefreshResponse {
  access_token: string;
  user?: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: "idle" | "loading" | "ready";
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_COOKIE = "wl_session";

function setSessionCookie(value: "1" | "") {
  if (typeof document === "undefined") return;
  const expires =
    value === ""
      ? "Thu, 01 Jan 1970 00:00:00 GMT"
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; expires=${expires}; SameSite=Lax`;
}

function readSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${SESSION_COOKIE}=1`));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");

  const hydrate = useCallback(async () => {
    if (!readSessionCookie()) {
      setStatus("ready");
      return;
    }
    setStatus("loading");
    try {
      const res = await apiFetch<RefreshResponse>("/api/auth/refresh", {
        method: "POST",
      });
      setAccessToken(res.access_token);
      if (res.user) setUser(res.user);
      else {
        const me = await apiFetch<AuthUser>("/api/auth/me");
        setUser(me);
      }
    } catch {
      setSessionCookie("");
      setAccessToken(null);
      setUser(null);
    } finally {
      setStatus("ready");
    }
  }, []);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setAccessToken(res.access_token);
    setSessionCookie("1");
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setSessionCookie("");
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user) return false;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const value: AuthContextValue = {
    user,
    status,
    login,
    logout,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

export { ProblemError };
