import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRouter from "./router/AppRouter";
import { ThemeProvider } from "@mui/material/styles";
import { dashboardTheme } from "./theme/dashboardTheme";
import reportWebVitals from "./reportWebVitals";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ThemeProvider theme={dashboardTheme}>
    <AppRouter />
  </ThemeProvider>
);

reportWebVitals();