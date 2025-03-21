import "./wdyr"; // MUST BE FIRST IMPORT
import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import React from "react";
import { StoreProvider } from "./Store/Store";
import ErrorBoundary from "./components/ErrorBoundary";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "dayjs/locale/nb";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@mui/material/styles";
import { dashboardTheme } from "./theme/dashboardTheme";

// Enable why-did-you-render for the entire app
if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React);
}

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
        <StoreProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="nb">
            <QueryClientProvider client={queryClient}>
              {children}
              <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-left" />
            </QueryClientProvider>
          </LocalizationProvider>
        </StoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
