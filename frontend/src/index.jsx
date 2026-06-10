import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import AppRouter from "./router/AppRouter";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App>
      <AppRouter />
    </App>
  </React.StrictMode>
);
