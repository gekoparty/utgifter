import React, { lazy, Suspense, useEffect } from "react";
import { Box, LinearProgress, Stack, Typography } from "@mui/material";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "../layout/Layout";
import ProtectedRoute from "../auth/ProtectedRoute";

const loadBrandScreen = () => import("../screens/BrandScreen");
const loadAccountScreen = () => import("../screens/AccountScreen");
const loadAdminUsersScreen = () => import("../screens/AdminUsersScreen");
const loadCategoryScreen = () => import("../screens/CategoryScreen");
const loadExpenseScreen = () => import("../screens/ExpenseScreen");
const loadHomeScreen = () => import("../screens/HomeScreen");
const loadIncomeScreen = () => import("../features/Incomes/IncomeScreen");
const loadLocationScreen = () => import("../screens/LocationScreen");
const loadLoginScreen = () => import("../screens/LoginScreen");
const loadProductScreen = () => import("../screens/ProductScreen");
const loadShopScreen = () => import("../screens/ShopScreen");
const loadStatsScreen = () => import("../screens/StatsScreen");
const loadRecurringExpenseScreen = () =>
  import("../features/RecurringExpenses/RecurringExpenseScreen");

const BrandScreen = lazy(loadBrandScreen);
const AccountScreen = lazy(loadAccountScreen);
const AdminUsersScreen = lazy(loadAdminUsersScreen);
const CategoryScreen = lazy(loadCategoryScreen);
const ExpenseScreen = lazy(loadExpenseScreen);
const HomeScreen = lazy(loadHomeScreen);
const IncomeScreen = lazy(loadIncomeScreen);
const LocationScreen = lazy(loadLocationScreen);
const LoginScreen = lazy(loadLoginScreen);
const ProductScreen = lazy(loadProductScreen);
const ShopScreen = lazy(loadShopScreen);
const StatsScreen = lazy(loadStatsScreen);
const RecurringExpenseScreen = lazy(loadRecurringExpenseScreen);

const PageLoadingFallback = () => (
  <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 4 } }}>
    <Stack spacing={1.5} sx={{ maxWidth: 520 }}>
      <Typography variant="body2" color="text.secondary" fontWeight={800}>
        Laster siden...
      </Typography>
      <LinearProgress sx={{ borderRadius: 999 }} />
    </Stack>
  </Box>
);

const LazyRoute = ({ children }) => (
  <Suspense fallback={<PageLoadingFallback />}>
    {children}
  </Suspense>
);

const prefetchWhenIdle = (loader) => {
  const run = () => loader().catch(() => {});
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(run, { timeout: 5000 });
  }
  return window.setTimeout(run, 1500);
};

const cancelIdlePrefetch = (handle) => {
  if (typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(handle);
  } else {
    window.clearTimeout(handle);
  }
};

const RoutePrefetcher = () => {
  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection?.saveData || ["slow-2g", "2g"].includes(connection?.effectiveType)) return undefined;

    const handles = [
      prefetchWhenIdle(loadExpenseScreen),
      prefetchWhenIdle(loadRecurringExpenseScreen),
      prefetchWhenIdle(loadStatsScreen),
      prefetchWhenIdle(loadProductScreen),
    ];

    return () => handles.forEach(cancelIdlePrefetch);
  }, []);

  return null;
};

const AppRouter = () => (
  <BrowserRouter>
    <RoutePrefetcher />
    <Routes>
      <Route
        path="/login"
        element={<LazyRoute><LoginScreen /></LazyRoute>}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route
            index
            element={<LazyRoute><HomeScreen /></LazyRoute>}
          />
          <Route
            path="expenses"
            element={<LazyRoute><ExpenseScreen /></LazyRoute>}
          />
          <Route
            path="incomes"
            element={<LazyRoute><IncomeScreen /></LazyRoute>}
          />
          <Route
            path="categories"
            element={<LazyRoute><CategoryScreen /></LazyRoute>}
          />
          <Route
            path="shops"
            element={<LazyRoute><ShopScreen /></LazyRoute>}
          />
          <Route
            path="brands"
            element={<LazyRoute><BrandScreen /></LazyRoute>}
          />
          <Route
            path="locations"
            element={<LazyRoute><LocationScreen /></LazyRoute>}
          />
          <Route
            path="products"
            element={<LazyRoute><ProductScreen /></LazyRoute>}
          />
          <Route
            path="recurring-expenses"
            element={<LazyRoute><RecurringExpenseScreen /></LazyRoute>}
          />
          <Route
            path="stats"
            element={<LazyRoute><StatsScreen /></LazyRoute>}
          />
          <Route
            path="account"
            element={<LazyRoute><AccountScreen /></LazyRoute>}
          />
          <Route
            path="admin/users"
            element={<LazyRoute><AdminUsersScreen /></LazyRoute>}
          />
        </Route>

      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
