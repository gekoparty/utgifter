import "./wdyr"; // MUST BE FIRST IMPORT
import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import { StoreProvider } from "./Store/Store";
import ErrorBoundary from "./components/ErrorBoundary";
import PermanentDrawerLeft from "./components/NavBar/PermanentDrawerLeft";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Import the QueryClient and QueryClientProvider
import "dayjs/locale/nb";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Box, Container } from "@mui/material";
import React from "react";

// Enable why-did-you-render for the entire app
if (process.env.NODE_ENV === "development") {
  const whyDidYouRender = require("@welldone-software/why-did-you-render");
  whyDidYouRender(React); // This will start tracking all components
}

// Create a QueryClient instance
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
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Manage drawer state

  const title = React.useMemo(
    () => location.pathname.replace(/\W/g, " "),
    [location.pathname]
  );

  return (
    <ErrorBoundary>
      <StoreProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="nb">
          <QueryClientProvider client={queryClient}>
            {" "}
            {/* Wrap with QueryClientProvider */}
            <PermanentDrawerLeft
              title={title}
              isDrawerOpen={isDrawerOpen}
              setIsDrawerOpen={setIsDrawerOpen}
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                backgroundColor: "#2C2C2C", // Dark background color for the layout
                padding: 2, // Optional padding to provide some space around the content
                borderRadius: 2, // Optional rounded corners
                marginLeft: isDrawerOpen ? "240px" : "0", // Adjust the margin when the drawer is open
                width: "100%", // Ensure it takes the full available width
                height: "100vh", // Ensure it takes the full height
              }}
            >
              <Container maxWidth="lg" sx={{ padding: 3 }}>
                <Outlet />
              </Container>
            </Box>
            <ReactQueryDevtools
              initialIsOpen={false}
              buttonPosition="top-left"
            />
          </QueryClientProvider>
        </LocalizationProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
