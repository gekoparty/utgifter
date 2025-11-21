import { createTheme } from "@mui/material/styles";

export const dashboardTheme = createTheme({
  palette: {
    primary: {
      main: "#009be5",
      contrastText: "#fff",
    },
    background: {
      default: "#eaf6ff", // subtle bluish canvas
      paper: "#ffffff",
    },
    white: {
      main: "#fff",
    },
  },
  
  typography: {
    h1: {
      fontSize: "1.6rem",
      fontWeight: 600,
      color: "#0b2540",
      letterSpacing: "0.5px",
      textTransform: "capitalize",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fontSize: "1.7rem",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "linear-gradient(135deg, #f6fbff 0%, #eaf6ff 100%)",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          boxShadow: "0 8px 24px rgba(2,12,27,0.06)",
          borderRadius: 12,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          boxShadow: "0 8px 24px rgba(2,12,27,0.06)",
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: "0.95rem",
          fontWeight: 700,
          borderRadius: 10,
          textTransform: "none",
        },
        contained: {
          boxShadow: "0 6px 18px rgba(2,12,27,0.08)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "transparent",
          boxShadow: "none",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 24,
          paddingRight: 24,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
        },
      },
    },
  },
});