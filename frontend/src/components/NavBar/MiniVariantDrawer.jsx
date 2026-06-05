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
import { mainNavbarItems } from "./Consts/NavBarListItems.jsx";
import { Link, useLocation, matchPath } from "react-router-dom";

const openedWidth = 240;
const closedWidth = 70;
const ROW_HEIGHT = 48;

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
    backgroundColor:
      theme.vars?.palette.background.paper || theme.palette.background.paper,
  },
}));

const ActiveBubble = styled("div")(({ theme }) => ({
  position: "absolute",
  left: 8,
  right: 8,
  height: 40,
  borderRadius: 12,
  pointerEvents: "none",
  backgroundColor: theme.vars
    ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.13)`
    : alpha(theme.palette.primary.main, 0.13),
  transition: "transform 0.25s ease, opacity 0.25s ease",
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

  const handleToggle = React.useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, [setIsDrawerOpen]);

  React.useEffect(() => {
    if (isMobile) {
      setIsDrawerOpen(false);
    }
  }, [isMobile, setIsDrawerOpen]);

  const drawerWidth = isMobile ? 0 : isDrawerOpen ? openedWidth : closedWidth;

  // Active index: supports nested routes like /products/123 -> /products
  const activeIndex = React.useMemo(() => {
    return mainNavbarItems.findIndex((item) =>
      matchPath(
        { path: item.route, end: item.route === "/" },
        location.pathname,
      ),
    );
  }, [location.pathname]);

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
          backgroundColor: "background.paper",
          opacity: 0.85,
        }}
      >
        <Toolbar sx={{ gap: 1, minWidth: 0 }}>
          {isMobile && (
            <IconButton
              edge="start"
              onClick={handleToggle}
              color="inherit"
              aria-label="Open menu"
              sx={{ flexShrink: 0 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h6"
            color="text.primary"
            noWrap
            sx={{ minWidth: 0 }}
          >
            {title}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <StyledDrawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: { xs: 0, sm: isDrawerOpen ? openedWidth : closedWidth },
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
            justifyContent: isDrawerOpen ? "flex-end" : "center",
          }}
        >
          <IconButton
            onClick={handleToggle}
            color="inherit"
            aria-label="Toggle drawer"
          >
            {isDrawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>

        <Divider />

        <List sx={{ position: "relative" }}>
          {activeIndex !== -1 && (
            <ActiveBubble
              sx={{
                transform: `translateY(${activeIndex * ROW_HEIGHT}px)`,
                opacity: isDrawerOpen ? 1 : 0.5,
              }}
            />
          )}

          {mainNavbarItems.map(({ id, icon, label, route }) => {
            const isActive = Boolean(
              matchPath({ path: route, end: route === "/" }, location.pathname),
            );

            return (
              <ListItem key={id} disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  component={Link}
                  to={route} // ✅ absolute routes
                  onClick={() => {
                    if (isMobile) setIsDrawerOpen(false);
                  }}
                  sx={{
                    minHeight: ROW_HEIGHT,
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
