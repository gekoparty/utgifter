import { createTheme } from "@mui/material/styles";

export const dashboardTheme = createTheme({
  palette: {
    background: {
      default: "#e3f2fd", // light bluish background for the whole app
      paper: "#ffffff",   // white for cards, tables, etc.
    },
    white: {
      main: "#fff",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: "0.875rem",
          fontWeight: 600,
          borderRadius: 2.5,
          "&.MuiButton-contained": {
            backgroundColor: "#009be5",
            "&:hover": {
              backgroundColor: "#006db3",
            },
          },
          "&.MuiButton-outlined": {
            color: "#fff",
            borderColor: "rgba(255, 255, 255, 0.7)",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          },
          "&.Mui-disabled": {
            backgroundColor: "rgba(0,0,0,0.12)",
          },
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fontSize: "1.7rem",
        },
      },
    },
  },
  typography: {
    h1: {
      fontSize: "1.6rem",
      fontWeight: 600,
      color: "#fff",
      letterSpacing: "0.5px",
      textTransform: "capitalize",
    },
  },
});