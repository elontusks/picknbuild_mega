"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Principal } from "@/lib/authz/types";

interface AuthContextValue {
  principal: Principal | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchPrincipal(): Promise<Principal | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { principal: Principal | null };
    return body.principal;
  } catch {
    return null;
  }
}

/**
 * Wrap the app (or any subtree) in this to hydrate the current Principal
 * and make `useAuth` / `useCan` / `<Gate>` work. Not mounted by default —
 * consumers opt in when they add their first gated UI.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const p = await fetchPrincipal();
    setPrincipal(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ principal, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}
