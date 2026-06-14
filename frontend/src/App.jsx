import React, { useMemo } from "react";
import "./styles/App.css";
import "@fontsource/roboto/300.css";
// ... all other font imports ...
import { StoreProvider, useAppPreferences } from "./store/Store";
import ErrorBoundary from "./components/ErrorBoundary";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "dayjs/locale/nb";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@mui/material/styles";
import { createDashboardTheme } from "./styles/theme/dashboardTheme";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalErrorBanner from "./components/commons/ErrorHandling/GlobalErrorBanner.jsx";
import GlobalNotificationSnackbar from "./components/commons/Feedback/GlobalNotificationSnackbar.jsx";
import { ColorModeContext } from "./styles/theme/ColorModeContext.jsx";

// Create a QueryClient instance for React Query v5
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
    },
  },
});

function AppThemeProvider({ children }) {
  const { preferences, setPreference } = useAppPreferences();
  const mode = preferences.themeMode === "light" ? "light" : "dark";
  const theme = useMemo(() => createDashboardTheme(mode), [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setPreference("themeMode", mode === "dark" ? "light" : "dark"),
    }),
    [mode, setPreference],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="nb">
          <QueryClientProvider client={queryClient}>
            <GlobalErrorBanner />
            {children}
            <GlobalNotificationSnackbar />
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
          </QueryClientProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

function App({ children }) {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <AppThemeProvider>{children}</AppThemeProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
