import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "../App";
import Layout from "../layout/Layout";
import CategoryScreen from "../screens/CategoryScreen";
import ExpenseScreen from "../screens/ExpenseScreen";
import ShopScreen from "../screens/ShopScreen";
import BrandScreen from "../screens/BrandScreen";
import LocationScreen from "../screens/LocationScreen";
import ProductScreen from "../screens/ProductScreen";

const AppRouter = () => (
  <BrowserRouter>
    <App> {/* Wrap everything with global providers from App.js */}
      <Routes>
        <Route element={<Layout />}> {/* Layout is applied only once */}
          <Route path="/" element={<CategoryScreen />} /> {/* Example default page */}
          <Route path="categories" element={<CategoryScreen />} />
          <Route path="expenses" element={<ExpenseScreen />} />
          <Route path="shops" element={<ShopScreen />} />
          <Route path="brands" element={<BrandScreen />} />
          <Route path="locations" element={<LocationScreen />} />
          <Route path="products" element={<ProductScreen />} />
        </Route>
      </Routes>
    </App>
  </BrowserRouter>
);

export default AppRouter;