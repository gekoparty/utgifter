export const getTableStyles = () => ({
  muiTableHeadCellStyles: {
    backgroundColor: "#1f1f22",
    color: "#f4f4f4",
    fontWeight: 600,
    borderBottom: "1px solid rgba(255,255,255,0.12)",
  },

  muiTableBodyCellStyles: {
    backgroundColor: "#18181b",
    color: "#e3e3e3",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  muiTopToolbarStyles: {
    backgroundColor: "#232327",
    color: "#eaeaea",
    boxShadow: "0 2px 10px rgba(0,0,0,0.4)",

    // Make all toolbar elements readable
    "& .MuiIconButton-root": {
      color: "#eaeaea",
    },
    "& .MuiButtonBase-root": {
      color: "#eaeaea",
    },
    "& .MuiSvgIcon-root": {
      color: "#ffffff",
    },
    "& .MuiTypography-root": {
      color: "#eaeaea",
    },
  },

  muiBottomToolbarStyles: {
    backgroundColor: "#232327",
    color: "#eaeaea",
    boxShadow: "0 -2px 10px rgba(0,0,0,0.4)",
    "& .MuiIconButton-root": { color: "#eaeaea" },
    "& .MuiSvgIcon-root": { color: "#ffffff" },
  },

  // Search input (global filter)
  muiSearchTextFieldProps: {
    sx: {
      "& .MuiInputBase-root": {
        backgroundColor: "#2a2a2d",
        borderRadius: 1,
        color: "#fff",
      },
      "& input": {
        color: "#fff !important",
      },
      "& .MuiInputLabel-root": {
        color: "rgba(255,255,255,0.65)",
      },
      "& .MuiSvgIcon-root": {
        color: "#fff",
      },
    },
  },

  // Column filter inputs
  muiFilterTextFieldProps: {
    sx: {
      "& .MuiInputBase-root": {
        backgroundColor: "#2a2a2d",
        borderRadius: 1,
        color: "#fff",
      },
      "& input": {
        color: "#fff !important",
      },
      "& .MuiInputLabel-root": {
        color: "rgba(255,255,255,0.65)",
      },
      "& .MuiSvgIcon-root": {
        color: "#fff",
      },
    },
  },

  // Toggle buttons (show filters, density, columns, fullscreen)
  toolbarButtonStyles: {
    sx: {
      color: "#eaeaea",
      borderRadius: "6px",
      padding: "4px 8px",
      "&:hover": {
        backgroundColor: "rgba(255,255,255,0.08)",
      },

      "& .MuiSvgIcon-root": {
        color: "#ffffff",
      },
    },
  },
});
