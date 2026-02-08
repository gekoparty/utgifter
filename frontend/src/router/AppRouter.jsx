// src/router/AppRouter.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "../App";
import Layout from "../layout/Layout";
import BareLayout from "../layout/Barelayout";

import CategoryScreen from "../screens/CategoryScreen";
import ExpenseScreen from "../screens/ExpenseScreen";
import ShopScreen from "../screens/ShopScreen";
import BrandScreen from "../screens/BrandScreen";
import LocationScreen from "../screens/LocationScreen";
import ProductScreen from "../screens/ProductScreen";
import StatsScreen from "../screens/StatsScreen";
import RecurringExpenseScreen from "../screens/RecurringExpenses/RecurringExpenseScreen"

const AppRouter = () => (
  <BrowserRouter>
    <App>
      <Routes>
        {/* Layout with sidebar */}
        <Route path="/" element={<Layout />}>
          {/* ✅ Home = Expenses */}
          <Route index element={<ExpenseScreen />} />

          <Route path="expenses" element={<ExpenseScreen />} />
          <Route path="categories" element={<CategoryScreen />} />
          <Route path="shops" element={<ShopScreen />} />
          <Route path="brands" element={<BrandScreen />} />
          <Route path="locations" element={<LocationScreen />} />
          <Route path="products" element={<ProductScreen />} />
          <Route path="recurring-expenses" element={<RecurringExpenseScreen />} />
        </Route>

        {/* stats page without sidebar */}
        <Route path="/stats" element={<BareLayout />}>
          <Route index element={<StatsScreen />} />
        </Route>
      </Routes>
    </App>
  </BrowserRouter>
);

export default AppRouter;
