import React from "react";
import "./App.css";
import "@fontsource/roboto/300.css";
// ... all other font imports ...
import { StoreProvider } from "./Store/Store";
import ErrorBoundary from "./components/ErrorBoundary";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "dayjs/locale/nb";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@mui/material/styles";
import { dashboardTheme } from "./theme/dashboardTheme";
import CssBaseline from "@mui/material/CssBaseline";

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

function App({ children }) {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={dashboardTheme}>
        <CssBaseline />
        <StoreProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="nb">
            <QueryClientProvider client={queryClient}>
              {children}
              <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
            </QueryClientProvider>
          </LocalizationProvider>
        </StoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;