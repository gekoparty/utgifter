import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("react-router")) {
            return "vendor-router";
          }

          if (id.includes("react-dom") || id.includes("react/")) {
            return "vendor-react";
          }

          if (id.includes("axios")) {
            return "vendor-http";
          }

          if (id.includes("@mui/icons-material")) {
            return "vendor-mui-icons";
          }

          if (
            id.includes("@mui/material") ||
            id.includes("@mui/system") ||
            id.includes("@mui/styled-engine") ||
            id.includes("@emotion/")
          ) {
            return "vendor-mui";
          }

          if (id.includes("@mui/x-date-pickers")) {
            return "vendor-mui-x";
          }

          if (
            id.includes("@tanstack/react-query") ||
            id.includes("@tanstack/query-core")
          ) {
            return "vendor-query";
          }

          if (id.includes("recharts")) {
            return "vendor-recharts";
          }

          if (id.includes("echarts")) {
            return "vendor-echarts";
          }

          if (id.includes("@nivo/")) {
            return "vendor-nivo";
          }

          if (
            id.includes("material-react-table") ||
            id.includes("@tanstack/react-table") ||
            id.includes("@tanstack/table-core") ||
            id.includes("@tanstack/virtual")
          ) {
            return "vendor-tables";
          }

          if (
            id.includes("react-select") ||
            id.includes("yup") ||
            id.includes("lodash")
          ) {
            return "vendor-forms";
          }

          if (id.includes("dayjs")) {
            return "vendor-date";
          }

          return "vendor";
        },
      },
    },
  },
});
