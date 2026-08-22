// src/components/NavBar/MiniVariantDrawer.jsx
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
  useMediaQuery,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LogoutIcon from "@mui/icons-material/Logout";
import { mainNavbarItems } from "./Consts/NavBarListItems.jsx";
import { Link, useLocation, matchPath } from "react-router-dom";
import ThemeModeSwitch from "../commons/ThemeModeSwitch.jsx";
import { useAuth } from "../../auth/useAuth";

const openedWidth = 240;
const closedWidth = 70;
const ROW_HEIGHT = 48;

const StyledDrawer = styled(Drawer)(({ theme, open }) => ({
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
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha("#1D1D2A", 0.96)
        : alpha(theme.palette.background.paper, 0.98),
    backgroundImage:
      theme.palette.mode === "dark"
        ? "linear-gradient(180deg, rgba(255,255,255,0.030), rgba(255,255,255,0.008))"
        : "none",
    backdropFilter: "blur(10px)",
  },
}));

export default function MiniVariantDrawer({
  children,
  title,
  isDrawerOpen,
  setIsDrawerOpen,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const location = useLocation();
  const { isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleToggle = React.useCallback(() => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
      return;
    }

    setIsDrawerOpen((prev) => !prev);
  }, [isMobile, setIsDrawerOpen]);

  const handleCloseMobile = React.useCallback(() => {
    setMobileOpen(false);
  }, []);

  React.useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const drawerWidth = isMobile ? 0 : isDrawerOpen ? openedWidth : closedWidth;
  const drawerOpen = isMobile ? mobileOpen : isDrawerOpen;

  // Active index: supports nested routes like /products/123 -> /products
  const visibleNavbarItems = React.useMemo(
    () => mainNavbarItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin],
  );

  const groupedNavbarItems = React.useMemo(() => {
    const groups = [];
    for (const item of visibleNavbarItems) {
      const section = item.section || "Meny";
      let group = groups.find((entry) => entry.section === section);
      if (!group) {
        group = { section, items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
    return groups;
  }, [visibleNavbarItems]);

  return (
    <Box sx={{ display: "flex" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        color="transparent"
        sx={{
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          transition: (t) =>
            t.transitions.create(["width", "margin"], {
              duration: t.transitions.duration.standard,
            }),
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(25,25,36,0.94)"
              : "rgba(255,255,255,0.94)",
          backgroundImage: "none",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 1, minWidth: 0 }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={handleToggle}
              color="inherit"
              aria-label="Open menu"
              sx={{ flexShrink: 0, position: "relative", zIndex: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            color="text.primary"
            noWrap
            sx={{ flexGrow: 1, minWidth: 0 }}
          >
            {title}
          </Typography>

          <ThemeModeSwitch />
          <IconButton onClick={logout} color="inherit" aria-label="Logg ut">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <StyledDrawer
        variant={isMobile ? "temporary" : "permanent"}
        open={drawerOpen}
        onClose={handleCloseMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: { xs: "auto", sm: isDrawerOpen ? openedWidth : closedWidth },
          "& .MuiDrawer-paper": {
            width: {
              xs: "min(82vw, 300px)",
              sm: isDrawerOpen ? openedWidth : closedWidth,
            },
          },
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: drawerOpen ? "flex-end" : "center",
          }}
        >
          <IconButton
            onClick={handleToggle}
            color="inherit"
            aria-label="Toggle drawer"
          >
            {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>

        <Divider />

        <List sx={{ position: "relative", px: 0.75 }}>
          {groupedNavbarItems.map((group) => (
            <React.Fragment key={group.section}>
              {drawerOpen && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    px: 1.5,
                    pt: 1.5,
                    pb: 0.5,
                    fontWeight: 900,
                    textTransform: "uppercase",
                    letterSpacing: 0,
                  }}
                >
                  {group.section}
                </Typography>
              )}

              {group.items.map(({ id, icon, label, route }) => {
            const isActive = Boolean(
              matchPath({ path: route, end: route === "/" }, location.pathname),
            );

            return (
              <ListItem key={id} disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  component={Link}
                  to={route} // ✅ absolute routes
                  onClick={() => {
                    if (isMobile) handleCloseMobile();
                  }}
                  sx={{
                    minHeight: ROW_HEIGHT,
                    justifyContent: drawerOpen ? "initial" : "center",
                    px: drawerOpen ? 1.5 : 1,
                    position: "relative",
                    color: isActive ? "primary.main" : "text.secondary",
                    borderRadius: 1.5,
                    mb: 0.25,
                    width: "auto",
                    bgcolor: isActive ? alpha(theme.palette.primary.main, 0.13) : "transparent",
                    border: "1px solid",
                    borderColor: isActive ? alpha(theme.palette.primary.main, 0.22) : "transparent",
                    "&:hover": {
                      bgcolor: "action.hover",
                      color: "primary.main",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: drawerOpen ? 2 : "auto",
                      justifyContent: "center",
                      color: "inherit",
                    }}
                  >
                    {icon}
                  </ListItemIcon>

                  {drawerOpen && (
                    <ListItemText
                      primary={label}
                      sx={{ opacity: 1, transition: "opacity 0.25s" }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
              })}
            </React.Fragment>
          ))}
        </List>
      </StyledDrawer>

      {/* Main content */}
      <Box
        component="main"
        sx={(theme) => ({
          flexGrow: 1,
          minHeight: "100vh",
          bgcolor: "background.default",
          minWidth: 0,
          px: { xs: 1, sm: 2, md: 3 },
          // push below fixed AppBar
          pt: `calc(${theme.mixins.toolbar.minHeight}px + ${theme.spacing(2)})`,
        })}
      >
        <Container
          maxWidth="lg"
          disableGutters
          sx={{ width: "100%", maxWidth: "100%" }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
