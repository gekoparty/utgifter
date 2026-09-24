import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import AppRouter from "./router/AppRouter";
import App from "./App";

const RootWrapper = import.meta.env.VITE_STRICT_MODE === "true"
  ? React.StrictMode
  : React.Fragment;

createRoot(document.getElementById("root")).render(
  <RootWrapper>
    <App>
      <AppRouter />
    </App>
  </RootWrapper>
);
