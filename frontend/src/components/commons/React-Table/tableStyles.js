// src/components/commons/React-Table/getTableStyles.js
export const getTableStyles = (theme) => {
  const isDark = theme.palette.mode === "dark";

  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const headerBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const rowOddBg = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)";
  const rowHoverBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  return {
    // Table "paper" container (avoid overflow clipping artifacts)
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        bgcolor: "transparent",
        backgroundImage: "none",
        borderRadius: 0,
        border: "none",
        overflow: "visible",
      },
    },

    // Top toolbar
    muiTopToolbarProps: {
      sx: {
        px: 1,
        py: 1,
        bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        borderBottom: `1px solid ${border}`,
      },
    },

    // Header row shadow separator
    muiTableHeadRowProps: {
      sx: {
        boxShadow: `inset 0 -1px ${border}`,
        borderRadius: 0, // ensure square edges
      },
    },

    // Header cells
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: headerBg,
        color: theme.palette.text.primary,
        fontWeight: 700,
        letterSpacing: 0.2,
        borderColor: border,
      },
    },

    // Body cells
    muiTableBodyCellProps: {
      sx: {
        color: theme.palette.text.primary,
        borderColor: border,
        fontSize: "0.875rem",
        py: 1,
      },
    },

    // Zebra + hover rows
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        transition: "background-color 120ms ease",
        backgroundColor: row?.index % 2 === 0 ? "transparent" : rowOddBg,
        "&:hover": { backgroundColor: rowHoverBg },
      },
    }),

    // Scrollbar styling
    muiTableContainerProps: {
      sx: {
        "&::-webkit-scrollbar": { height: 8 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.20)",
          borderRadius: 4,
        },
      },
    },

    // Global search input
    muiSearchTextFieldProps: {
      size: "small",
      sx: {
        "& .MuiInputBase-root": {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 8,
        },
      },
    },

    // Column filter inputs (less puffy)
    muiFilterTextFieldProps: {
      size: "small",
      sx: {
        "& .MuiInputBase-root": {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          borderRadius: 8,
          fontSize: "0.8rem",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "transparent",
        },
      },
    },
  };
};
