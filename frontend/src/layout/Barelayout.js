import React, { useState, useMemo, useCallback } from "react";
import { Outlet, Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Container,
  Box,
  FormControl,
  Button,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import WindowedSelect from "react-windowed-select";
import debounce from "lodash.debounce";
import useInfiniteProducts from "../hooks/useInfiniteProducts";

// ADJUST THIS PATH to point to where you saved your getSelectStyles function
import { getSelectStyles } from "../theme/selectStyles"; 

export default function BareLayout() {
  const [view, setView] = useState("expenses");
  const [productId, setProductId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  
  const theme = useTheme();

  // 1. Generate the dark-mode aware styles
  const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);

  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);

  const productOptions = useMemo(() => {
    return (infiniteData?.pages || []).flatMap((page) =>
      page.products.map((p) => ({
        label: p.name,
        value: p._id || p.id,
      }))
    );
  }, [infiniteData]);

  const debouncedSearch = useMemo(
    () => debounce((q) => setProductSearch(q), 300),
    []
  );
  
  const handleInputChange = useCallback(
    (value) => debouncedSearch(value || ""),
    [debouncedSearch]
  );

  return (
    <>
      <AppBar
        position="static"
        color="transparent"
        sx={{ backgroundColor: theme.palette.background.paper + "CC" }}
      >
        <Toolbar>
          <IconButton
            component={RouterLink}
            to="/"
            edge="start"
            color="inherit"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, color: theme.palette.text.primary }}
          >
            Statistics
          </Typography>

          <FormControl size="small" sx={{ m: 1, minWidth: 150 }}>
            <Button
              variant={view === "expenses" ? "contained" : "outlined"}
              onClick={() => {
                setView("expenses");
                setProductId("");
              }}
            >
              Monthly Expenses
            </Button>
            <Button
              variant={view === "price" ? "contained" : "outlined"}
              onClick={() => {
                setView("price");
                setProductId("");
              }}
              sx={{ ml: 1 }}
            >
              Price History
            </Button>
          </FormControl>

          {view === "price" && (
            <Box sx={{ width: 250, m: 1 }}>
              <WindowedSelect
                isClearable
                options={productOptions}
                value={productOptions.find((o) => o.value === productId) || null}
                onChange={(opt) => setProductId(opt?.value || "")}
                onInputChange={handleInputChange}
                onMenuScrollToBottom={() => {
                  if (hasNextPage) fetchNextPage();
                }}
                isLoading={isLoadingProducts}
                loadingMessage={() => "Loading…"}
                noOptionsMessage={() =>
                  productSearch ? "No matches" : "Type to search"
                }
                placeholder="Search products..."
                menuPortalTarget={document.body}
                // 2. Apply the theme-aware styles here
                styles={selectStyles} 
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          p: 3,
          backgroundColor: "background.default",
          minHeight: "100vh",
        }}
      >
        <Container maxWidth="lg">
          <Outlet context={{ view, productId }} />
        </Container>
      </Box>
    </>
  );
}