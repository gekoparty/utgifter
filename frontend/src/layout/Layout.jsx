import React, { useState, useMemo, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MiniVariantDrawer from "../components/NavBar/MiniVariantDrawer";

export default function Layout() {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const routeTitles = {
    "/": "Hjem",
    "/expenses": "Utgifter",
    "/categories": "Kategorier",
    "/shops": "Butikker",
    "/brands": "Merker",
    "/locations": "Steder",
    "/products": "Produkter",
    "/recurring-expenses": "Faste kostnader",
  };

  const title = useMemo(
    () => routeTitles[location.pathname] ?? location.pathname.replace(/\W/g, " "),
    [location.pathname]
  );

   // ✅ auto-collapse on some routes
  useEffect(() => {
    const fullscreenRoutes = ["/recurring-expenses"];
    if (fullscreenRoutes.includes(location.pathname)) {
      setIsDrawerOpen(false);
    }
  }, [location.pathname]);

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
