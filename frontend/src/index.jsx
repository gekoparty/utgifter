import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppRouter from "./router/AppRouter";


// 1. Import the new App wrapper component
import App from "./App"; 

const apiUrl = import.meta.env.VITE_REACT_APP_API_URL;
// Optional: You can put this log inside App.jsx or leave it here
console.log("API_URL from env:", apiUrl); // Use the new variable

createRoot(document.getElementById("root")).render(
  <React.StrictMode> 
    <App>
      <AppRouter />
    </App>
  </React.StrictMode>
);
