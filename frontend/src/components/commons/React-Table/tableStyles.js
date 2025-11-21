export const getTableStyles = (theme) => {
  const isDarkMode = theme.palette.mode === "dark";

  const headBg = isDarkMode ? theme.palette.background.paper : theme.palette.grey[900];
  const headColor = isDarkMode ? theme.palette.text.primary : theme.palette.common.white;
  const bodyBg = isDarkMode ? theme.palette.background.default : theme.palette.grey[800];
  const bodyColor = isDarkMode ? theme.palette.text.primary : theme.palette.grey[100];
  const toolbarBg = isDarkMode ? theme.palette.background.paper : theme.palette.grey[900];
  const toolbarColor = isDarkMode ? theme.palette.text.primary : theme.palette.common.white;
  const borderColor = isDarkMode
    ? "rgba(255,255,255,0.12)"
    : "rgba(0,0,0,0.12)";

  return {
    muiTableHeadCellStyles: {
      backgroundColor: headBg,
      color: headColor,
      fontWeight: 600,
      borderBottom: `1px solid ${borderColor}`,
    },

    muiTableBodyCellStyles: {
      backgroundColor: bodyBg,
      color: bodyColor,
      borderBottom: `1px solid ${borderColor}`,
    },

    muiTopToolbarStyles: {
      backgroundColor: toolbarBg,
      color: toolbarColor,
      boxShadow: theme.shadows[4],

      "& .MuiIconButton-root": { color: toolbarColor },
      "& .MuiButtonBase-root": { color: toolbarColor },
      "& .MuiSvgIcon-root": { color: toolbarColor },
      "& .MuiTypography-root": { color: toolbarColor },
    },

    muiBottomToolbarStyles: {
      backgroundColor: toolbarBg,
      color: toolbarColor,
      boxShadow: theme.shadows[4],
      "& .MuiIconButton-root": { color: toolbarColor },
      "& .MuiSvgIcon-root": { color: toolbarColor },
    },

    muiSearchTextFieldProps: {
      sx: {
        "& .MuiInputBase-root": {
          backgroundColor: theme.palette.background.default,
          borderRadius: 1,
          color: theme.palette.text.primary,
        },
        "& input": {
          color: theme.palette.text.primary + " !important",
        },
        "& .MuiInputLabel-root": {
          color: theme.palette.text.secondary,
        },
        "& .MuiSvgIcon-root": {
          color: theme.palette.text.primary,
        },
      },
    },

    muiFilterTextFieldProps: {
      sx: {
        "& .MuiInputBase-root": {
          backgroundColor: theme.palette.background.default,
          borderRadius: 1,
          color: theme.palette.text.primary,
        },
        "& input": {
          color: theme.palette.text.primary + " !important",
        },
        "& .MuiInputLabel-root": {
          color: theme.palette.text.secondary,
        },
        "& .MuiSvgIcon-root": {
          color: theme.palette.text.primary,
        },
      },
    },

    toolbarButtonStyles: {
      sx: {
        color: toolbarColor,
        borderRadius: "6px",
        padding: "4px 8px",
        "&:hover": {
          backgroundColor: theme.palette.action.hover,
        },
        "& .MuiSvgIcon-root": {
          color: toolbarColor,
        },
      },
    },
  };
};
