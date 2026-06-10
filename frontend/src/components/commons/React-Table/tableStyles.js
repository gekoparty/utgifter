// src/components/commons/React-Table/getTableStyles.js
export const getTableStyles = (theme) => {
  const isDark = theme.palette.mode === "dark";

  const border = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)";
  const borderSoft = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(15,23,42,0.07)";
  const surface = isDark ? "rgba(31,32,46,0.98)" : "rgba(255,255,255,0.99)";
  const pinnedSurface = isDark ? "rgb(31,32,46)" : "rgb(255,255,255)";
  const surfaceMuted = isDark
    ? "rgba(255,255,255,0.035)"
    : "rgba(248,250,252,0.92)";
  const headerBg = isDark ? "rgba(42,45,65,0.98)" : "rgba(248,250,252,0.98)";
  const headerText = isDark ? "#F8FAFC" : "#0F172A";
  const rowOddBg = isDark ? "rgba(255,255,255,0.018)" : "rgba(15,23,42,0.012)";
  const rowHoverBg = isDark ? "rgba(59,130,246,0.14)" : "rgba(37,99,235,0.07)";
  const actionHoverBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)";
  const focusRing = `${theme.palette.primary.main}55`;

  return {
    displayColumnDefOptions: {
      "mrt-row-actions": {
        header: "",
        size: 56,
        muiTableHeadCellProps: {
          sx: {
            backgroundColor: headerBg,
            borderRight: `1px solid ${border}`,
            boxShadow: isDark
              ? "6px 0 12px rgba(0,0,0,0.18)"
              : "6px 0 12px rgba(15,23,42,0.06)",
            minWidth: 56,
            width: 56,
            zIndex: 5,
          },
        },
        muiTableBodyCellProps: {
          sx: {
            backgroundColor: pinnedSurface,
            borderRight: `1px solid ${borderSoft}`,
            boxShadow: isDark
              ? "6px 0 12px rgba(0,0,0,0.14)"
              : "6px 0 12px rgba(15,23,42,0.045)",
            minWidth: 56,
            width: 56,
            zIndex: 4,
          },
        },
      },
    },

    muiTablePaperProps: {
      elevation: 0,
      sx: {
        bgcolor: surface,
        backgroundImage: "none",
        borderRadius: 1.5,
        border: `1px solid ${border}`,
        boxShadow: isDark
          ? "0 10px 26px rgba(0,0,0,0.24)"
          : "0 10px 24px rgba(15,23,42,0.06)",
        overflow: "hidden",
        "& .MuiTablePagination-root": {
          color: theme.palette.text.secondary,
        },
        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
          {
            fontSize: "0.8125rem",
          },
        "& .MuiIconButton-root": {
          borderRadius: 1.5,
          color: theme.palette.text.secondary,
          transition:
            "background-color 140ms ease, color 140ms ease, border-color 140ms ease",
          "&:hover": {
            backgroundColor: actionHoverBg,
            color: theme.palette.text.primary,
          },
        },
      },
    },

    muiTopToolbarProps: {
      sx: {
        minHeight: 52,
        px: 1.25,
        py: 0.75,
        bgcolor: surfaceMuted,
        borderBottom: `1px solid ${border}`,
        gap: 1,
        flexWrap: "wrap",
        "& .MuiInputBase-root": {
          boxShadow: "none",
        },
      },
    },

    muiBottomToolbarProps: {
      sx: {
        minHeight: 50,
        px: 1,
        bgcolor: surfaceMuted,
        borderTop: `1px solid ${border}`,
      },
    },

    muiTableHeadRowProps: {
      sx: {
        boxShadow: `inset 0 -1px ${border}`,
      },
    },

    muiTableHeadCellProps: {
      sx: {
        backgroundColor: headerBg,
        color: headerText,
        borderColor: borderSoft,
        borderBottom: `1px solid ${border}`,
        boxShadow: "none",
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: 0,
        lineHeight: 1.2,
        py: 0.85,
        textTransform: "uppercase",
        "& .Mui-TableHeadCell-Content": {
          alignItems: "center",
          gap: 0.5,
        },
        "& .Mui-TableHeadCell-Content-Labels": {
          gap: 0.5,
        },
        "& .MuiButtonBase-root": {
          color: theme.palette.text.secondary,
        },
        "& .MuiTableSortLabel-root:hover": {
          color: theme.palette.text.primary,
        },
      },
    },

    muiTableBodyCellProps: {
      sx: {
        color: theme.palette.text.primary,
        borderColor: borderSoft,
        fontSize: "0.84rem",
        lineHeight: 1.45,
        py: 0.95,
        verticalAlign: "middle",
        whiteSpace: "nowrap",
        "&:first-of-type": {
          borderLeft: 0,
        },
      },
    },

    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        backgroundClip: "padding-box",
        backgroundColor: row?.index % 2 === 0 ? "transparent" : rowOddBg,
        transition: "background-color 140ms ease, box-shadow 140ms ease",
        "&:hover": {
          backgroundColor: rowHoverBg,
          boxShadow: `inset 2px 0 0 ${theme.palette.primary.main}`,
        },
        "&.Mui-selected, &.Mui-selected:hover": {
          backgroundColor: isDark
            ? "rgba(37,99,235,0.20)"
            : "rgba(37,99,235,0.10)",
        },
      },
    }),

    muiTableContainerProps: {
      sx: {
        bgcolor: surface,
        maxHeight: { xs: "calc(100dvh - 210px)", sm: "calc(100vh - 260px)" },
        minHeight: { xs: 220, sm: 280 },
        overflowX: "auto",
        "&::-webkit-scrollbar": { height: 10, width: 10 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.22)"
            : "rgba(15,23,42,0.20)",
          border: "2px solid transparent",
          borderRadius: 999,
          backgroundClip: "content-box",
        },
      },
    },

    muiSearchTextFieldProps: {
      size: "small",
      sx: {
        "& .MuiInputBase-root": {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.05)"
            : "rgba(255,255,255,0.92)",
          borderRadius: 1.5,
          minHeight: 38,
          transition: "box-shadow 140ms ease, border-color 140ms ease",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: border,
        },
        "& .MuiInputBase-root.Mui-focused": {
          boxShadow: `0 0 0 3px ${focusRing}`,
        },
      },
    },

    muiFilterTextFieldProps: {
      size: "small",
      sx: {
        "& .MuiInputBase-root": {
          backgroundColor: isDark
            ? "rgba(255,255,255,0.045)"
            : "rgba(255,255,255,0.84)",
          borderRadius: 1,
          fontSize: "0.8rem",
          minHeight: 32,
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: borderSoft,
        },
        "& .MuiInputBase-root.Mui-focused": {
          boxShadow: `0 0 0 2px ${focusRing}`,
        },
      },
    },
  };
};
