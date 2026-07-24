import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { requestJson } from "../api/httpClient";
import { authClient } from "./authClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const session = authClient.useSession();
  const [appUser, setAppUser] = useState(null);
  const [appUserLoading, setAppUserLoading] = useState(false);

  const authUser = session.data?.user ?? null;
  const isAuthenticated = Boolean(authUser);

  const loadAppUser = useCallback(async () => {
    if (!authUser) {
      setAppUser(null);
      return null;
    }

    setAppUserLoading(true);
    try {
      const payload = await requestJson("/api/app-users/me");
      setAppUser(payload?.user ?? null);
      return payload?.user ?? null;
    } catch {
      setAppUser(null);
      return null;
    } finally {
      setAppUserLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadAppUser();
  }, [loadAppUser]);

  const login = useCallback(
    async ({ email, password }) => {
      const result = await authClient.signIn.email({ email, password });
      if (result?.error) throw new Error(result.error.message || "Kunne ikke logge inn.");
      const refreshedSession = await session.refetch();
      if (!refreshedSession?.data?.user) {
        throw new Error(
          "Innloggingen ble godkjent, men nettleseren lagret ikke økten. Sjekk cookie/API-oppsett.",
        );
      }
      return result?.data;
    },
    [session],
  );

  const signUp = useCallback(
    async ({ name, email, password }) => {
      const result = await authClient.signUp.email({ name, email, password });
      if (result?.error) throw new Error(result.error.message || "Kunne ikke opprette bruker.");
      const refreshedSession = await session.refetch();
      if (!refreshedSession?.data?.user) {
        throw new Error(
          "Brukeren ble opprettet, men nettleseren lagret ikke økten. Sjekk cookie/API-oppsett.",
        );
      }
      return result?.data;
    },
    [session],
  );

  const logout = useCallback(async () => {
    await authClient.signOut();
    setAppUser(null);
    await session.refetch();
  }, [session]);

  const value = useMemo(
    () => ({
      user: authUser,
      appUser,
      loading: session.isPending || appUserLoading,
      isAuthenticated,
      isAdmin: appUser?.role === "admin",
      login,
      signUp,
      logout,
      refreshSession: session.refetch,
      refreshAppUser: loadAppUser,
    }),
    [
      authUser,
      appUser,
      session.isPending,
      session.refetch,
      appUserLoading,
      isAuthenticated,
      login,
      signUp,
      logout,
      loadAppUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
