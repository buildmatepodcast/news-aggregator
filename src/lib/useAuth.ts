"use client";

import { useCallback, useEffect, useState } from "react";

export type AuthState = {
  loggedIn: boolean;
  hasAccess: boolean;
  email: string | null;
};

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false, hasAccess: false, email: null });
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    setAuth({ loggedIn: data.loggedIn, hasAccess: data.hasAccess, email: data.email ?? null });
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuth({ loggedIn: false, hasAccess: false, email: null });
  }, []);

  return { ...auth, loaded, refresh, logout };
}
