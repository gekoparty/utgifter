import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import AppRouter from "./router/AppRouter";
import reportWebVitals from "./reportWebVitals";

// 1. Import the new App wrapper component
import App from "./App"; 

// Optional: You can put this log inside App.jsx or leave it here
console.log("API_URL from env:", process.env.REACT_APP_API_URL);

const root = ReactDOM.createRoot(document.getElementById("root"));

// 2. Render your App wrapper, passing the router as a child (the `children` prop)
root.render(
  <React.StrictMode> 
    <App>
      <AppRouter />
    </App>
  </React.StrictMode>
);

reportWebVitals();