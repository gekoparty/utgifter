import React, { useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MiniVariantDrawer from "../components/NavBar/MiniVariantDrawer";
import { useAppPreferences } from "../store/Store";

export default function Layout() {
  const location = useLocation();
  const { preferences, setPreference } = useAppPreferences();
  const isDrawerOpen = preferences.sidebarOpen !== false;

  const setIsDrawerOpen = useCallback(
    (nextValue) => {
      const resolved =
        typeof nextValue === "function" ? nextValue(isDrawerOpen) : nextValue;
      setPreference("sidebarOpen", Boolean(resolved));
    },
    [isDrawerOpen, setPreference],
  );

  const routeTitles = {
    "/": "Hjem",
    "/expenses": "Utgifter",
    "/incomes": "Inntekter",
    "/categories": "Kategorier",
    "/shops": "Butikker",
    "/brands": "Merker",
    "/locations": "Steder",
    "/products": "Produkter",
    "/recurring-expenses": "Faste kostnader",
    "/stats": "Statistikk",
    "/account": "Min konto",
    "/admin/users": "Brukere",
  };

  const title = useMemo(
    () =>
      routeTitles[location.pathname] ?? location.pathname.replace(/\W/g, " "),
    [location.pathname],
  );

  return (
    <MiniVariantDrawer
      title={title}
      isDrawerOpen={isDrawerOpen}
      setIsDrawerOpen={setIsDrawerOpen}
    >
      <Outlet />
    </MiniVariantDrawer>
  );
}

