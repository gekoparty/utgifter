import React, { useCallback, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MiniVariantDrawer from "../components/NavBar/MiniVariantDrawer";
import { useAppPreferences } from "../store/Store";
import { useTranslation } from "../i18n/useTranslation";

export default function Layout() {
  const location = useLocation();
  const { preferences, setPreference } = useAppPreferences();
  const { t } = useTranslation();
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
    "/": t("navHome"),
    "/expenses": t("navExpenses"),
    "/incomes": t("navIncomes"),
    "/categories": t("navCategories"),
    "/shops": t("navShops"),
    "/brands": t("navBrands"),
    "/locations": t("navLocations"),
    "/products": t("navProducts"),
    "/recurring-expenses": t("navRecurring"),
    "/stats": t("navStats"),
    "/account": t("navAccount"),
    "/admin/users": t("navUsers"),
  };

  const title = useMemo(
    () =>
      routeTitles[location.pathname] ?? location.pathname.replace(/\W/g, " "),
    [location.pathname, t],
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

