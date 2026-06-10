import React, { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "../layout/Layout";
import BarePageLayout from "../layout/BarePageLayout";

const BrandScreen = lazy(() => import("../screens/BrandScreen"));
const CategoryScreen = lazy(() => import("../screens/CategoryScreen"));
const ExpenseScreen = lazy(() => import("../screens/ExpenseScreen"));
const LocationScreen = lazy(() => import("../screens/LocationScreen"));
const ProductScreen = lazy(() => import("../screens/ProductScreen"));
const ShopScreen = lazy(() => import("../screens/ShopScreen"));
const StatsScreen = lazy(() => import("../screens/StatsScreen"));
const RecurringExpenseScreen = lazy(() =>
  import("../features/RecurringExpenses/RecurringExpenseScreen")
);

const LazyRoute = ({ children }) => (
  <Suspense fallback={null}>
    {children}
  </Suspense>
);

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route
          index
          element={<LazyRoute><ExpenseScreen /></LazyRoute>}
        />
        <Route
          path="expenses"
          element={<LazyRoute><ExpenseScreen /></LazyRoute>}
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
      </Route>

      <Route path="/stats" element={<BarePageLayout />}>
        <Route
          index
          element={<LazyRoute><StatsScreen /></LazyRoute>}
        />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
