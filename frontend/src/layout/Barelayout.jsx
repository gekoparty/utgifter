// src/layout/BareLayout.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Outlet, Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Box,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  Stack,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VirtualizedSelect from "../components/commons/VirtualizedSelect/VirtualizedSelect";
import debounce from "lodash.debounce";
import useInfiniteProducts from "../hooks/useInfiniteProducts";
import { getSelectStyles } from "../theme/selectStyles";

export default function BareLayout() {
  const [view, setView] = useState("expenses");
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const theme = useTheme();
  const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);

  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);

  const productOptions = useMemo(() => {
    const pages = infiniteData?.pages ?? [];
    return pages.flatMap((page) =>
      (page.products ?? []).map((p) => ({
        label: p.name,
        value: p._id || p.id,
      }))
    );
  }, [infiniteData]);

  // ✅ React 19 / StrictMode friendly debounce (cancel on cleanup)
  const debouncedSearch = useMemo(() => {
    return debounce((q) => setProductSearch(q), 300);
  }, []);

  useEffect(() => {
    return () => debouncedSearch.cancel();
  }, [debouncedSearch]);

  const handleInputChange = useCallback(
    (value) => {
      debouncedSearch(value || "");
    },
    [debouncedSearch]
  );

  // ✅ prevent SSR/test crashes
  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : undefined;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Top bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Toolbar>
          <IconButton
            component={RouterLink}
            to="/"
            edge="start"
            sx={{ mr: 2, color: "text.primary" }}
            aria-label="Back"
          >
            <ArrowBackIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              color: "text.primary",
              letterSpacing: "-0.5px",
            }}
          >
            Statistikk
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Controls */}
      <Box
        sx={{
          bgcolor: "background.paper",
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 2,
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <ToggleButtonGroup
              size="small"
              exclusive
              value={view}
              onChange={(_, nextView) => {
                if (!nextView) return;
                setView(nextView);
                setProductId("");
              }}
              aria-label="statistikkvisning"
              sx={{
                width: { xs: "100%", sm: "auto" },
                "& .MuiToggleButton-root": {
                  flex: { xs: 1, sm: "initial" },
                  px: { xs: 1.5, sm: 3 },
                  textTransform: "none",
                  fontWeight: 700,
                },
              }}
            >
              <ToggleButton value="expenses">Måneder</ToggleButton>
              <ToggleButton value="price">Prishistorikk</ToggleButton>
            </ToggleButtonGroup>

            <Box
              sx={{
                width: { xs: "100%", sm: 300 },
                display: view === "price" ? "block" : "none",
              }}
            >
              <VirtualizedSelect
                isClearable
                options={productOptions}
                value={productOptions.find((o) => o.value === productId) || null}
                onChange={(opt) => setProductId(opt?.value || "")}
                onInputChange={handleInputChange}
                isLoading={isLoadingProducts}
                placeholder="Søk etter produkt..."
                menuPortalTarget={menuPortalTarget}
                styles={selectStyles}
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
              />
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: { xs: 2.5, md: 4 },
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 260px)"
              : "linear-gradient(180deg, rgba(25,118,210,0.05), transparent 280px)",
        }}
      >
        <Container maxWidth="lg">
          <Outlet context={{ view, productId }} />
        </Container>
      </Box>
    </Box>
  );
}
