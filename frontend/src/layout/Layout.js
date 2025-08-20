import React, { useState, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Container, Box } from "@mui/material";
import PermanentDrawerLeft from "../components/NavBar/PermanentDrawerLeft";

const Layout = () => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const title = useMemo(() => location.pathname.replace(/\W/g, " "), [location.pathname]);

  return (
    <PermanentDrawerLeft
      title={title}
      isDrawerOpen={isDrawerOpen}
      setIsDrawerOpen={setIsDrawerOpen}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center", // center horizontally inside available space
          pt: 4,
          minHeight: "100vh",
          backgroundColor: "background.default", // bluish
        }}
      >
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </PermanentDrawerLeft>
  );
};

export default Layout;