import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { dashboardTheme } from "./dashboardTheme";
import Categories from "./screens/Categories";
import Expenses from "./screens/Expenses";
import ShopScreen from './screens/ShopScreen';
import BrandScreen from "./screens/BrandScreen";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={dashboardTheme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route path="categories" element={<Categories />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="shops" element={<ShopScreen />} />
            <Route path="brands" element={<BrandScreen />} />
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
