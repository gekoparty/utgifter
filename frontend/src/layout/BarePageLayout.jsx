// src/layout/BarePageLayout.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Link as RouterLink, Outlet } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  useTheme,
  Stack,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import VirtualizedSelect from "../components/commons/VirtualizedSelect/VirtualizedSelect";
import debounce from "lodash.debounce";
import useInfiniteProducts from "../hooks/useInfiniteProducts";
import { getSelectStyles } from "../styles/theme/selectStyles";
import ThemeModeSwitch from "../components/commons/ThemeModeSwitch.jsx";

export default function BarePageLayout() {
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
      (page.products ?? []).map((product) => ({
        label: product.name,
        value: product._id || product.id,
      }))
    );
  }, [infiniteData]);

  const debouncedSearch = useMemo(() => {
    return debounce((query) => setProductSearch(query), 300);
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
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Toolbar sx={{ py: { xs: 1, md: 0.75 } }}>
          <Container maxWidth="xl" disableGutters>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  minWidth: { md: 220 },
                }}
              >
                <Tooltip title="Til utgifter">
                  <Button
                    component={RouterLink}
                    to="/expenses"
                    size="small"
                    variant="outlined"
                    aria-label="Til utgifter"
                    sx={{
                      minWidth: { xs: 38, sm: "auto" },
                      px: { xs: 1, sm: 1.25 },
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontWeight: 800,
                    }}
                  >
                    <ArrowBackRoundedIcon fontSize="small" />
                    <Box component="span" sx={{ ml: 0.75, display: { xs: "none", sm: "inline" } }}>
                      Utgifter
                    </Box>
                  </Button>
                </Tooltip>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 850,
                    color: "text.primary",
                    letterSpacing: 0,
                  }}
                >
                  Statistikk
                </Typography>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="flex-end"
                sx={{ flex: 1 }}
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
                      px: { xs: 1.5, sm: 2.5 },
                      textTransform: "none",
                      fontWeight: 800,
                    },
                  }}
                >
                  <ToggleButton value="expenses">Måneder</ToggleButton>
                  <ToggleButton value="price">Prishistorikk</ToggleButton>
                </ToggleButtonGroup>

                <Box
                  sx={{
                    width: { xs: "100%", sm: 320 },
                    display: view === "price" ? "block" : "none",
                  }}
                >
                  <VirtualizedSelect
                    isClearable
                    options={productOptions}
                    value={productOptions.find((option) => option.value === productId) || null}
                    onChange={(option) => setProductId(option?.value || "")}
                    onInputChange={handleInputChange}
                    isLoading={isLoadingProducts}
                    placeholder="Søk etter produkt..."
                    menuPortalTarget={menuPortalTarget}
                    styles={selectStyles}
                    hasNextPage={hasNextPage}
                    fetchNextPage={fetchNextPage}
                  />
                </Box>

                <Box sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}>
                  <ThemeModeSwitch />
                </Box>
              </Stack>
            </Stack>
          </Container>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: { xs: 1.5, md: 2 },
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(180deg, rgba(255,255,255,0.02), transparent 260px)"
              : "linear-gradient(180deg, rgba(25,118,210,0.05), transparent 280px)",
        }}
      >
        <Container maxWidth="xl">
          <Outlet context={{ view, productId }} />
        </Container>
      </Box>
    </Box>
  );
}
