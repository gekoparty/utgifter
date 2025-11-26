export const getTableStyles = (theme) => {
  const isDark = theme.palette.mode === "dark";

  return {
    muiTableHeadCellStyles: {
      backgroundColor: isDark
        ? theme.palette.background.paper
        : theme.palette.grey[900],
      color: isDark ? theme.palette.text.primary : theme.palette.common.white,
      fontWeight: 600,
    },

    muiTableBodyCellStyles: {
      backgroundColor: isDark
        ? theme.palette.background.default
        : theme.palette.grey[800],
      color: isDark ? theme.palette.text.primary : theme.palette.grey[100],
    },

    muiSearchTextFieldProps: {
      sx: {
        "& .MuiInputBase-root": {
          backgroundColor: theme.palette.background.default,
          borderRadius: 1,
        },
      },
    },

    muiFilterTextFieldProps: {
      sx: {
        "& .MuiInputBase-root": {
          backgroundColor: theme.palette.background.default,
          borderRadius: 1,
        },
      },
    },
  };
};
