import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { dashboardTheme } from "./dashboardTheme";
import CategoryScreen from './screens/CategoryScreen';
import ExpenseScreen from "./screens/ExpenseScreen";
import ShopScreen from './screens/ShopScreen';
import BrandScreen from "./screens/BrandScreen";
import LocationScreen from './screens/LocationScreen'
import ProductScreen from "./screens/ProductScreen";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={dashboardTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="categories" element={<CategoryScreen />} />
            <Route path="expenses" element={<ExpenseScreen />} />
            <Route path="shops" element={<ShopScreen />} />
            <Route path="brands" element={<BrandScreen />} />
            <Route path="locations" element={<LocationScreen />} />
            <Route path="products" element={<ProductScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
