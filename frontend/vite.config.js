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

          if (id.includes("@mui/x-date-pickers")) return "vendor-date-pickers";
          if (id.includes("@mui/") || id.includes("@emotion/")) return "vendor-mui";
          if (id.includes("@tanstack/")) return "vendor-query";
          if (id.includes("material-react-table")) return "vendor-table";
          if (id.includes("echarts")) return "vendor-echarts";
          if (id.includes("@nivo/") || id.includes("d3-")) return "vendor-nivo";
          if (id.includes("react-select")) return "vendor-select";
          if (id.includes("better-auth")) return "vendor-auth";
          if (id.includes("tesseract.js")) return "vendor-ocr";
          if (id.includes("lodash")) return "vendor-lodash";

          return "vendor";
        },
      },
    },
  },
});
