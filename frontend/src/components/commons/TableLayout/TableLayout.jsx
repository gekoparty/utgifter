// src/components/commons/TableLayout/TableLayout.jsx
import React from "react";
import { Box } from "@mui/material";

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={(t) => ({
        borderRadius: 2,
        p: { xs: 1, sm: 1.5, md: 2 },
        width: "100%",
        maxWidth: "none",
        minWidth: 0,
        overflow: "hidden",

        border: "1px solid",
        borderColor:
          t.palette.mode === "dark"
            ? "rgba(255,255,255,0.12)"
            : "rgba(0,0,0,0.08)",

        bgcolor:
          t.palette.mode === "dark"
            ? "rgba(27,27,39,0.80)"
            : "rgba(255,255,255,0.86)",
        backgroundImage:
          t.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))"
            : "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(245,247,251,0.72))",

        backdropFilter: "blur(16px)",
        boxShadow:
          t.palette.mode === "dark"
            ? "0 20px 56px rgba(0,0,0,0.34)"
            : "0 18px 42px rgba(15,23,42,0.08)",
      })}
    >
      {children}
    </Box>
  );
};

export default TableLayout;
