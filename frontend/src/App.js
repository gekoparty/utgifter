import "./App.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { StoreProvider } from "./Store/Store";
import ErrorBoundary from "./components/ErrorBoundary";
import PermanentDrawerLeft from "./components/NavBar/PermanentDrawerLeft";
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import the QueryClient and QueryClientProvider
import "dayjs/locale/nb";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Box } from "@mui/material";

function App({ children }) {
  const [title, setTitle] = useState(null);
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Manage drawer state

  useEffect(() => {
    const parsedTitle = location.pathname.replace(/\W/g, " ");
    setTitle(parsedTitle);
  }, [location]);

  // Create a QueryClient instance
  const queryClient = new QueryClient();

  return (
    <ErrorBoundary>
    <StoreProvider>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="nb">
    <QueryClientProvider client={queryClient}> {/* Wrap with QueryClientProvider */}
      <PermanentDrawerLeft title={title} />
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
      <Outlet />
            </Box>
      <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </LocalizationProvider>
    </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
