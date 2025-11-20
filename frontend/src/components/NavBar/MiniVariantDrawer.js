import * as React from "react";
import {
  Box,
  Drawer,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { styled } from "@mui/material/styles";

import { mainNavbarItems } from "./Consts/NavBarListItems";
import { Link, useLocation } from "react-router-dom";

// Drawer widths
const openedWidth = 240;
const closedWidth = 70;

// ----------------------- Drawer Styling -----------------------
const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: open ? openedWidth : closedWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: open
      ? theme.transitions.duration.enteringScreen
      : theme.transitions.duration.leavingScreen,
  }),
  "& .MuiDrawer-paper": {
    width: open ? openedWidth : closedWidth,
    overflowX: "hidden",
    background: "rgba(20, 20, 20, 0.40)", 
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRight: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "4px 0 20px rgba(0,0,0,0.25)",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: open
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
  },
}));

// ----------------------- Active Bubble -----------------------
const ActiveBubble = styled("div")(({ theme }) => ({
  position: "absolute",
  left: 8,
  right: 8,
  height: 40,
  borderRadius: "12px",
  background: "rgba(255, 255, 255, 0.12)",
  backdropFilter: "blur(10px)",
  transition: "transform 0.25s ease, opacity 0.25s ease",
}));

export default function MiniVariantDrawer({
  children,
  title,
  isDrawerOpen,
  setIsDrawerOpen,
}) {
  const handleToggle = () => setIsDrawerOpen((prev) => !prev);
  const location = useLocation();

  // find active index
  const activeIndex = mainNavbarItems.findIndex(
    (item) => item.route === location.pathname
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* ----------------------- AppBar ----------------------- */}
      <AppBar
        position="fixed"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          transition: (theme) =>
            theme.transitions.create(["width", "margin"], {
              duration: theme.transitions.duration.standard,
            }),
          ...(isDrawerOpen && {
            width: `calc(100% - ${openedWidth}px)`,
            ml: `${openedWidth}px`,
          }),
          ...(!isDrawerOpen && {
            width: `calc(100% - ${closedWidth}px)`,
            ml: `${closedWidth}px`,
          }),
        }}
      >
        <Toolbar>
          <Typography variant="h6">{title}</Typography>
        </Toolbar>
      </AppBar>

      {/* ----------------------- Drawer ----------------------- */}
      <StyledDrawer variant="permanent" open={isDrawerOpen}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: isDrawerOpen ? "flex-end" : "center",
          }}
        >
          <IconButton onClick={handleToggle}>
            {isDrawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>

        <Divider />

        <List sx={{ position: "relative" }}>
          {/* Active highlight bubble */}
          {activeIndex !== -1 && (
            <ActiveBubble
              style={{
                transform: `translateY(${activeIndex * 48}px)`,
                opacity: isDrawerOpen ? 1 : 0.5,
              }}
            />
          )}

          {mainNavbarItems.map(({ id, icon, label, route }, index) => {
            const isActive = location.pathname === route;

            return (
              <ListItem key={id} disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  component={Link}
                  to={route}
                  sx={{
                    minHeight: 48,
                    justifyContent: isDrawerOpen ? "initial" : "center",
                    px: 2.5,
                    position: "relative",
                    zIndex: 2,
                    color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                    transition: "color 0.2s",

                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.08)",
                      backdropFilter: "blur(15px)",
                      color: "#fff",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isDrawerOpen ? 2 : "auto",
                      justifyContent: "center",
                      color: "inherit",
                      transition: "all 0.2s",
                    }}
                  >
                    {icon}
                  </ListItemIcon>

                  {/* Show label only when expanded */}
                  {isDrawerOpen && (
                    <ListItemText
                      primary={label}
                      sx={{
                        opacity: isDrawerOpen ? 1 : 0,
                        transition: "opacity 0.25s",
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </StyledDrawer>

      {/* ----------------------- Main Content ----------------------- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: (theme) =>
            theme.transitions.create(["margin"], {
              duration: theme.transitions.duration.standard,
            }),
          ml: isDrawerOpen ? `${openedWidth}px` : `${closedWidth}px`,
          mt: 8,
        }}
      >
        <Container maxWidth="lg">{children}</Container>
      </Box>
    </Box>
  );
}
