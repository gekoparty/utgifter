// src/components/commons/React-Table/getTableStyles.js
export const getTableStyles = (theme) => {
  const isDark = theme.palette.mode === "dark";

  const border = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)";
  const borderSoft = isDark
    ? "rgba(255,255,255,0.06)"
    : "rgba(15,23,42,0.07)";
  const surface = isDark ? "rgba(36,36,52,0.96)" : "rgba(255,255,255,0.98)";
  const pinnedSurface = isDark ? "rgb(36,36,52)" : "rgb(255,255,255)";
  const surfaceMuted = isDark
    ? "rgba(255,255,255,0.035)"
    : "rgba(248,250,252,0.92)";
  const headerBg = isDark ? "rgba(48,52,74,0.98)" : "rgba(241,245,249,0.98)";
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
              ? "8px 0 14px rgba(0,0,0,0.22)"
              : "8px 0 14px rgba(15,23,42,0.08)",
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
              ? "8px 0 14px rgba(0,0,0,0.16)"
              : "8px 0 14px rgba(15,23,42,0.06)",
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
        borderRadius: 2,
        border: `1px solid ${border}`,
        boxShadow: isDark
          ? "0 18px 42px rgba(0,0,0,0.30)"
          : "0 16px 34px rgba(15,23,42,0.08)",
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
        minHeight: 58,
        px: 1.25,
        py: 1,
        bgcolor: surfaceMuted,
        borderBottom: `1px solid ${border}`,
        gap: 1,
        "& .MuiInputBase-root": {
          boxShadow: "none",
        },
      },
    },

    muiBottomToolbarProps: {
      sx: {
        minHeight: 54,
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
        fontSize: "0.75rem",
        fontWeight: 800,
        letterSpacing: 0,
        lineHeight: 1.2,
        py: 1,
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
      },
    },

    muiTableBodyCellProps: {
      sx: {
        color: theme.palette.text.primary,
        borderColor: borderSoft,
        fontSize: "0.875rem",
        lineHeight: 1.45,
        py: 1.05,
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
          boxShadow: `inset 3px 0 0 ${theme.palette.primary.main}`,
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
