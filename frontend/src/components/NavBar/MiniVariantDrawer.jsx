import * as React from "react";
import {
  Box,
  Drawer,
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
  useTheme
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { mainNavbarItems } from "./Consts/NavBarListItems.jsx";
import { Link, useLocation } from "react-router-dom";

const openedWidth = 240;
const closedWidth = 70;

/* ================= Drawer ================= */

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
    borderRight: "1px solid",
    borderColor: theme.vars?.palette.divider || theme.palette.divider,
    boxShadow: theme.shadows[4],
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: open
        ? theme.transitions.duration.enteringScreen
        : theme.transitions.duration.leavingScreen,
    }),
    bgcolor: "background.paper",
  },
}));

/* ================= Active bubble ================= */

const ActiveBubble = styled("div")(({ theme }) => ({
  position: "absolute",
  left: 8,
  right: 8,
  height: 40,
  borderRadius: 12,
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.13)`
    : alpha(theme.palette.primary.main, 0.13),
  transition: "transform 0.25s ease, opacity 0.25s ease",
}));

/* ================= Main component ================= */

export default function MiniVariantDrawer({
  children,
  title,
  isDrawerOpen,
  setIsDrawerOpen,
}) {
  const theme = useTheme();
  const location = useLocation();

  const handleToggle = () => setIsDrawerOpen((prev) => !prev);

  const activeIndex = mainNavbarItems.findIndex(
    (item) => item.route === location.pathname
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* ================= AppBar ================= */}
      <AppBar
        position="fixed"
        elevation={0}
        color="transparent"
        sx={{
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          transition: (theme) =>
            theme.transitions.create(["width", "margin"], {
              duration: theme.transitions.duration.standard,
            }),
          width: `calc(100% - ${isDrawerOpen ? openedWidth : closedWidth}px)`,
          ml: `${isDrawerOpen ? openedWidth : closedWidth}px`,
          bgcolor: "background.paper",
          opacity: 0.85,
        }}
      >
        <Toolbar>
          <Typography variant="h6" color="text.primary">
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* ================= Drawer ================= */}
      <StyledDrawer variant="permanent" open={isDrawerOpen}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: isDrawerOpen ? "flex-end" : "center",
          }}
        >
          <IconButton onClick={handleToggle} color="inherit">
            {isDrawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>

        <Divider />

        <List sx={{ position: "relative" }}>
          {activeIndex !== -1 && (
            <ActiveBubble
              sx={{
                transform: `translateY(${activeIndex * 48}px)`,
                opacity: isDrawerOpen ? 1 : 0.5,
              }}
            />
          )}

          {mainNavbarItems.map(({ id, icon, label, route }) => {
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
                    color: isActive ? "primary.main" : "text.secondary",
                    "&:hover": {
                      bgcolor: "action.hover",
                      color: "primary.main",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isDrawerOpen ? 2 : "auto",
                      justifyContent: "center",
                      color: "inherit",
                    }}
                  >
                    {icon}
                  </ListItemIcon>

                  {isDrawerOpen && (
                    <ListItemText
                      primary={label}
                      sx={{ opacity: 1, transition: "opacity 0.25s" }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </StyledDrawer>

      {/* ================= Main Content ================= */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          display: "flex",
          justifyContent: "center",
          bgcolor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Container maxWidth="lg" sx={{ width: "100%" }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
