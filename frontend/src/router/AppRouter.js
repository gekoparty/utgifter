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

const AppRouter = () => (
  <BrowserRouter>
    <App>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CategoryScreen />} />
          <Route path="categories" element={<CategoryScreen />} />
          <Route path="expenses" element={<ExpenseScreen />} />
          <Route path="shops" element={<ShopScreen />} />
          <Route path="brands" element={<BrandScreen />} />
          <Route path="locations" element={<LocationScreen />} />
          <Route path="products" element={<ProductScreen />} />
        </Route>
        {/* stats page without sidebar */}
        <Route element={<BareLayout />}>
          <Route path="stats" element={<StatsScreen />} />
        </Route>
      </Routes>
    </App>
  </BrowserRouter>
);

export default AppRouter;
