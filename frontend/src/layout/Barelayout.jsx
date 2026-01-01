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
  Button,
  ButtonGroup,
  useTheme,
  Paper,
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
            Statistics
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
            <ButtonGroup
              variant="outlined"
              size="small"
              aria-label="view switcher"
              sx={{ boxShadow: "none" }}
            >
              <Button
                variant={view === "expenses" ? "contained" : "outlined"}
                onClick={() => {
                  setView("expenses");
                  setProductId("");
                }}
                sx={{ px: 3 }}
              >
                Monthly
              </Button>

              <Button
                variant={view === "price" ? "contained" : "outlined"}
                onClick={() => {
                  setView("price");
                  setProductId("");
                }}
                sx={{ px: 3 }}
              >
                Price History
              </Button>
            </ButtonGroup>

            <Box
              sx={{
                width: { xs: "100%", sm: 300 },
                visibility: view === "price" ? "visible" : "hidden",
              }}
            >
              <VirtualizedSelect
                isClearable
                options={productOptions}
                value={productOptions.find((o) => o.value === productId) || null}
                onChange={(opt) => setProductId(opt?.value || "")}
                onInputChange={handleInputChange}
                isLoading={isLoadingProducts}
                placeholder="Search products..."
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
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 4 },
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Outlet context={{ view, productId }} />
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
