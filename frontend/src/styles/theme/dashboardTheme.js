import { createTheme } from "@mui/material/styles";

const getPalette = (mode) => {
  const isDark = mode === "dark";

  return {
    mode,
    primary: {
      main: "#2563EB",
      dark: "#1E4FCB",
      light: "#3B82F6",
      contrastText: "#fff",
    },
    secondary: {
      main: "#FBBF24",
      contrastText: "#111827",
    },
    background: {
      default: isDark ? "#1E1E2F" : "#F4F7FB",
      paper: isDark ? "#2C2C3F" : "#FFFFFF",
    },
    divider: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)",
    text: {
      primary: isDark ? "#E5E5E5" : "#101828",
      secondary: isDark ? "rgba(255,255,255,0.7)" : "#667085",
    },
    error: {
      main: isDark ? "#F87171" : "#D92D20",
      contrastText: "#fff",
    },
  };
};

export const createDashboardTheme = (mode = "dark") => {
  const isDark = mode === "dark";
  const palette = getPalette(mode);

  return createTheme({
    palette,

    shape: { borderRadius: 12 },

    typography: {
      fontFamily: "'Inter', sans-serif",
      h1: {
        fontSize: "1.5rem",
        fontWeight: 600,
        color: palette.text.primary,
      },
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? "rgba(30,30,47,0.9)"
              : "rgba(255,255,255,0.92)",
            color: palette.text.primary,
            boxShadow: isDark
              ? "0 2px 12px rgba(0,0,0,0.5)"
              : "0 2px 14px rgba(15,23,42,0.08)",
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${palette.divider}`,
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: palette.background.paper,
            borderRadius: 12,
            boxShadow: isDark
              ? "0 4px 20px rgba(0,0,0,0.5)"
              : "0 4px 20px rgba(15,23,42,0.08)",
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 8,
          },
          containedPrimary: {
            color: "#fff",
            backgroundColor: palette.primary.main,
            "&:hover": {
              backgroundColor: palette.primary.dark,
            },
          },
          outlined: {
            borderColor: isDark
              ? "rgba(255,255,255,0.4)"
              : "rgba(15,23,42,0.28)",
            color: palette.text.primary,
            "&:hover": {
              borderColor: palette.primary.main,
              backgroundColor: isDark
                ? "rgba(37,99,235,0.1)"
                : "rgba(37,99,235,0.08)",
            },
          },
        },
      },

      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiInputBase-root": {
              color: palette.text.primary,
            },
            "& .MuiInputLabel-root": {
              color: palette.text.secondary,
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark
                ? "rgba(255,255,255,0.3)"
                : "rgba(15,23,42,0.22)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.primary.main,
            },
          },
        },
      },

      MuiSelect: {
        styleOverrides: {
          root: {
            color: palette.text.primary,
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark
                ? "rgba(255,255,255,0.3)"
                : "rgba(15,23,42,0.22)",
            },
          },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#3A3A50" : "#EEF3FB",
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${palette.divider}`,
            color: palette.text.primary,
          },
        },
      },

      MuiToolbar: {
        styleOverrides: {
          root: {
            "& button, & .MuiTypography-root": {
              color: palette.text.primary,
            },
          },
        },
      },
    },
  });
};

export const dashboardTheme = createDashboardTheme("dark");
