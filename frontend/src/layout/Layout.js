import React, { useState, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Container } from "@mui/material";
import PermanentDrawerLeft from "../components/NavBar/PermanentDrawerLeft";

const DRAWER_WIDTH = 240;

const Layout = () => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const title = useMemo(() => location.pathname.replace(/\W/g, " "), [location.pathname]);

  return (
    <>
      <PermanentDrawerLeft
        title={title}
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          bgcolor: "#F5F5F5", // Light background improves readability
          ml: isDrawerOpen ? `${DRAWER_WIDTH}px` : "0",
          transition: "margin-left 0.3s ease",
          minHeight: "100vh",
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 4,
            flexGrow: 1,
            width: "100%",
          }}
        >
          <Container maxWidth="lg">
            <Outlet />
          </Container>
        </Box>
      </Box>
    </>
  );
};

export default Layout;
