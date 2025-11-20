import React, { useState, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import MiniVariantDrawer from "../components/NavBar/MiniVariantDrawer";

export default function Layout() {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const title = useMemo(
    () => location.pathname.replace(/\W/g, " "),
    [location.pathname]
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
