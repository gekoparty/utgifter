// src/components/commons/TableLayout/TableLayout.jsx
import React from "react";
import { Box } from "@mui/material";

const TableLayout = ({ children }) => {
  return (
    <Box
      sx={(t) => ({
        borderRadius: 4, // 👈 single source of rounding
        p: { xs: 2, md: 3 },
        width: "100%",
        maxWidth: "none",

        border: "1px solid",
        borderColor:
          t.palette.mode === "dark"
            ? "rgba(255,255,255,0.10)"
            : "rgba(0,0,0,0.08)",

        bgcolor:
          t.palette.mode === "dark"
            ? "rgba(18,18,24,0.85)" // slightly more opaque
            : "rgba(255,255,255,0.95)",

        backdropFilter: "blur(10px)",
        boxShadow:
          t.palette.mode === "dark"
            ? "0 12px 40px rgba(0,0,0,0.45)"
            : "0 10px 30px rgba(0,0,0,0.10)",
      })}
    >
      {children}
    </Box>
  );

  
};

export default TableLayout;
