import React, { useState, useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Container } from "@mui/material";
import PermanentDrawerLeft from "../components/NavBar/PermanentDrawerLeft";

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
          justifyContent: "center",
          backgroundColor: "#2C2C2C",
          padding: 2,
          borderRadius: 2,
          marginLeft: isDrawerOpen ? "240px" : "0",
          width: "100%",
          height: "100vh",
        }}
      >
        <Container maxWidth="lg" sx={{ padding: 3 }}>
          <Outlet />
        </Container>
      </Box>
    </>
  );
};

export default Layout;