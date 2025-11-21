import { createTheme } from "@mui/material/styles";

export const dashboardTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563EB",       // unified strong blue
      dark: "#1E4FCB",
      light: "#3B82F6",
      contrastText: "#fff",
    },
    background: {
      default: "#F5F7FA",     // page background
      paper: "#FFFFFF",       // cards/tables
    },
    divider: "#E2E8F0",
    text: {
      primary: "#1E293B",
      secondary: "#475569",
    },
  },

  shape: { borderRadius: 12 },

  typography: {
    h1: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "#1E293B",
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F5F7FA",
          color: "#1E293B",
          fontFamily: "'Inter', sans-serif",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          color: "#1E293B",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          borderBottom: "1px solid #E2E8F0",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
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
          backgroundColor: "#2563EB",
          "&:hover": {
            backgroundColor: "#1E4FCB",
          },
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#F0F2F5",
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #E2E8F0",
        },
      },
    },
  },
});
