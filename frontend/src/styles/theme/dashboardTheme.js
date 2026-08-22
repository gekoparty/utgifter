import { alpha, createTheme } from "@mui/material/styles";

const getPalette = (mode) => {
  const isDark = mode === "dark";

  return {
    mode,
    primary: {
      main: isDark ? "#4F8CFF" : "#2457D6",
      dark: isDark ? "#2F6BE6" : "#1A43B0",
      light: isDark ? "#7FB0FF" : "#4F8CFF",
      contrastText: "#fff",
    },
    secondary: {
      main: isDark ? "#F6B84B" : "#B7791F",
      contrastText: isDark ? "#111827" : "#fff",
    },
    success: {
      main: isDark ? "#5FD18A" : "#16834A",
    },
    warning: {
      main: isDark ? "#F6B84B" : "#B7791F",
    },
    background: {
      default: isDark ? "#171721" : "#F5F7FB",
      paper: isDark ? "#242432" : "#FFFFFF",
    },
    divider: isDark ? "rgba(255,255,255,0.11)" : "rgba(15,23,42,0.10)",
    text: {
      primary: isDark ? "#F4F5F8" : "#111827",
      secondary: isDark ? "rgba(244,245,248,0.68)" : "#667085",
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
      fontFamily: '"Roboto", "Inter", "Segoe UI", Arial, sans-serif',
      fontWeightRegular: 400,
      fontWeightMedium: 600,
      fontWeightBold: 800,
      h5: {
        fontWeight: 850,
        letterSpacing: 0,
      },
      h6: {
        fontWeight: 800,
        letterSpacing: 0,
      },
      subtitle1: {
        fontWeight: 750,
      },
      button: {
        fontWeight: 750,
        letterSpacing: 0,
      },
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
            backgroundImage: isDark
              ? "linear-gradient(180deg, rgba(79,140,255,0.08) 0%, rgba(23,23,33,0) 320px)"
              : "linear-gradient(180deg, rgba(36,87,214,0.055) 0%, rgba(245,247,251,0) 300px)",
            backgroundAttachment: "fixed",
            color: palette.text.primary,
            fontSynthesis: "none",
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark
              ? "rgba(25,25,36,0.92)"
              : "rgba(255,255,255,0.94)",
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
            backgroundColor: isDark
              ? alpha("#232332", 0.98)
              : alpha("#FFFFFF", 0.98),
            borderRadius: 10,
            backgroundImage: "none",
            boxShadow: isDark
              ? "0 10px 28px rgba(0,0,0,0.20)"
              : "0 10px 28px rgba(15,23,42,0.06)",
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            borderColor: palette.divider,
            backgroundImage: "none",
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            fontWeight: 750,
            textTransform: "none",
            borderRadius: 8,
            boxShadow: "none",
            minHeight: 36,
          },
          containedPrimary: {
            color: "#fff",
            backgroundImage: "none",
            backgroundColor: palette.primary.main,
            "&:hover": {
              backgroundImage: "none",
              backgroundColor: palette.primary.dark,
              boxShadow: isDark
                ? "0 8px 20px rgba(79,140,255,0.20)"
                : "0 8px 18px rgba(36,87,214,0.14)",
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
              borderRadius: 8,
              backgroundColor: isDark
                ? "rgba(255,255,255,0.025)"
                : "rgba(255,255,255,0.86)",
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
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderWidth: 1,
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

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 700,
          },
        },
      },

      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: 3,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.035)"
              : "rgba(15,23,42,0.035)",
          },
        },
      },

      MuiToggleButton: {
        styleOverrides: {
          root: {
            border: 0,
            borderRadius: 7,
            color: palette.text.secondary,
            fontWeight: 800,
            "&.Mui-selected": {
              color: palette.primary.contrastText,
              backgroundColor: palette.primary.main,
              "&:hover": {
                backgroundColor: palette.primary.dark,
              },
            },
          },
        },
      },

      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 40,
          },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 40,
            textTransform: "none",
            fontWeight: 800,
            borderRadius: 8,
          },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? "#303044" : "#EEF3FB",
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
