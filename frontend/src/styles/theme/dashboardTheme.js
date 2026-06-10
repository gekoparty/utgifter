import { createTheme } from "@mui/material/styles";

export const dashboardTheme = createTheme({
  palette: {
    mode: "dark", // dark mode
    primary: {
      main: "#2563EB",       // bright blue
      dark: "#1E4FCB",
      light: "#3B82F6",
      contrastText: "#fff",
    },
    secondary: {
      main: "#FBBF24",       // amber accent
      contrastText: "#000",
    },
    background: {
      default: "#1E1E2F",    // dark page background
      paper: "#2C2C3F",      // cards, tables, modals
    },
    divider: "rgba(255,255,255,0.12)",
    text: {
      primary: "#E5E5E5",
      secondary: "rgba(255,255,255,0.7)",
    },
    error: {
      main: "#F87171",
      contrastText: "#fff",
    },
  },

  shape: { borderRadius: 12 },

  typography: {
    fontFamily: "'Inter', sans-serif",
    h1: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "#fff",
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#1E1E2F",
          color: "#E5E5E5",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(30,30,47,0.9)",
          color: "#fff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.5)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#2C2C3F",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: "none",
          borderRadius: 8,
          color: "#fff",
        },
        containedPrimary: {
          backgroundColor: "#2563EB",
          "&:hover": {
            backgroundColor: "#1E4FCB",
          },
        },
        outlined: {
          borderColor: "rgba(255,255,255,0.4)",
          color: "#fff",
          "&:hover": {
            borderColor: "#2563EB",
            backgroundColor: "rgba(37,99,235,0.1)",
          },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiInputBase-root": {
            color: "#E5E5E5",
          },
          "& .MuiInputLabel-root": {
            color: "rgba(255,255,255,0.7)",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.3)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#2563EB",
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          color: "#E5E5E5",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.3)",
          },
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#3A3A50",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          color: "#E5E5E5",
        },
      },
    },

    MuiToolbar: {
      styleOverrides: {
        root: {
          "& button, & .MuiTypography-root": {
            color: "#fff",
          },
        },
      },
    },
  },
});
