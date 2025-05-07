// src/layout/BareLayout.jsx
import React, { useState } from "react";
import { Outlet, Link as RouterLink } from "react-router-dom";
import { AppBar, Toolbar, IconButton, Typography, Container, Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useQuery } from "@tanstack/react-query";

export default function BareLayout() {
  // Chart view state
  const [view, setView] = useState("expenses");
  const [productId, setProductId] = useState("");

  // Fetch products for dropdown
  const { data, isLoading, error } = useQuery({
    queryKey: ["productsForStats"],
    queryFn: () => fetch("/api/products").then(res => res.json()),
    enabled: view === "price"
  });
  const products = Array.isArray(data) ? data : data?.products || [];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton component={RouterLink} to="/" edge="start" color="inherit">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Statistics
          </Typography>

          {/* Chart type selector */}
          <FormControl size="small" sx={{ m: 1, minWidth: 150 }}>
            <InputLabel id="view-select-label">Chart</InputLabel>
            <Select
              labelId="view-select-label"
              value={view}
              label="Chart"
              onChange={e => {
                setView(e.target.value);
                setProductId("");
              }}
            >
              <MenuItem value="expenses">Monthly Expenses</MenuItem>
              <MenuItem value="price">Price History</MenuItem>
            </Select>
          </FormControl>

          {/* Product selector when price chart */}
          {view === "price" && (
            <FormControl size="small" sx={{ m: 1, minWidth: 150 }}>
              <InputLabel id="product-select-label">Product</InputLabel>
              <Select
                labelId="product-select-label"
                value={productId}
                label="Product"
                onChange={e => setProductId(e.target.value)}
                disabled={isLoading || !!error}
              >
                {isLoading && <MenuItem>Loading…</MenuItem>}
                {error && <MenuItem>Error loading</MenuItem>}
                {products.map(p => (
                  <MenuItem key={p._id || p.id} value={p._id || p.id}> {p.name} </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, backgroundColor: "#2C2C2C", minHeight: "100vh" }}>
        <Container maxWidth="lg">
          {/* Provide view and productId to child via context */}
          <Outlet context={{ view, productId }} />
        </Container>
      </Box>
    </>
  );
}
