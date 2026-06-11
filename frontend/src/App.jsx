import React, { useEffect, useMemo, useState } from "react";
import "./styles/App.css";
import "@fontsource/roboto/300.css";
// ... all other font imports ...
import { StoreProvider } from "./store/Store";
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

const THEME_STORAGE_KEY = "utgifter.themeMode";

function getInitialThemeMode() {
  if (typeof window === "undefined") return "dark";

  const savedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedMode === "light" || savedMode === "dark") return savedMode;

  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function App({ children }) {
  const [mode, setMode] = useState(getInitialThemeMode);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const theme = useMemo(() => createDashboardTheme(mode), [mode]);

  const colorMode = useMemo(
    () => ({
      mode,
      toggleColorMode: () =>
        setMode((currentMode) => (currentMode === "dark" ? "light" : "dark")),
    }),
    [mode],
  );

  return (
    <ErrorBoundary>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <StoreProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="nb">
              <QueryClientProvider client={queryClient}>
                <GlobalErrorBanner />
                {children}
                <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
              </QueryClientProvider>
            </LocalizationProvider>
          </StoreProvider>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
