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
            ? "rgba(255,255,255,0.10)"
            : "rgba(0,0,0,0.08)",

        bgcolor:
          t.palette.mode === "dark"
            ? "rgba(18,18,24,0.86)"
            : "rgba(255,255,255,0.95)",

        backdropFilter: "blur(10px)",
        boxShadow:
          t.palette.mode === "dark"
            ? "0 14px 38px rgba(0,0,0,0.34)"
            : "0 12px 28px rgba(15,23,42,0.08)",
      })}
    >
      {children}
    </Box>
  );
};

export default TableLayout;
