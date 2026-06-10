import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "../layout/Layout";
import BarePageLayout from "../layout/BarePageLayout";

import BrandScreen from "../screens/BrandScreen";
import CategoryScreen from "../screens/CategoryScreen";
import ExpenseScreen from "../screens/ExpenseScreen";
import LocationScreen from "../screens/LocationScreen";
import ProductScreen from "../screens/ProductScreen";
import ShopScreen from "../screens/ShopScreen";
import StatsScreen from "../screens/StatsScreen";
import RecurringExpenseScreen from "../features/RecurringExpenses/RecurringExpenseScreen";

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ExpenseScreen />} />
        <Route path="expenses" element={<ExpenseScreen />} />
        <Route path="categories" element={<CategoryScreen />} />
        <Route path="shops" element={<ShopScreen />} />
        <Route path="brands" element={<BrandScreen />} />
        <Route path="locations" element={<LocationScreen />} />
        <Route path="products" element={<ProductScreen />} />
        <Route path="recurring-expenses" element={<RecurringExpenseScreen />} />
      </Route>

      <Route path="/stats" element={<BarePageLayout />}>
        <Route index element={<StatsScreen />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
