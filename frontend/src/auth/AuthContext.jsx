import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { requestJson } from "../api/httpClient";
import { authClient } from "./authClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const session = authClient.useSession();
  const [appUser, setAppUser] = useState(null);
  const [appUserLoading, setAppUserLoading] = useState(false);
  const [stableAuthUser, setStableAuthUser] = useState(null);

  useEffect(() => {
    if (session.data?.user) {
      setStableAuthUser(session.data.user);
      return;
    }

    if (!session.isPending) {
      setStableAuthUser(null);
    }
  }, [session.data?.user, session.isPending]);

  const authUser = session.data?.user ?? (session.isPending ? stableAuthUser : null);
  const authUserId = authUser?.id ?? null;
  const isAuthenticated = Boolean(authUser);
  const isInitialAuthLoading = !stableAuthUser && session.isPending;

  const loadAppUser = useCallback(async () => {
    if (!authUserId) {
      setAppUser(null);
      return null;
    }

    setAppUserLoading(true);
    try {
      const payload = await requestJson("/api/app-users/me");
      setAppUser(payload?.user ?? null);
      return payload?.user ?? null;
    } catch {
      setAppUser((previousUser) => previousUser);
      return null;
    } finally {
      setAppUserLoading(false);
    }
  }, [authUserId]);

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
      loading: !isAuthenticated && (isInitialAuthLoading || appUserLoading),
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
      stableAuthUser,
      isInitialAuthLoading,
      isAuthenticated,
      login,
      signUp,
      logout,
      loadAppUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
