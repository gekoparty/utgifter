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
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/nb";

function App({ children }) {
  const [title, setTitle] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const parsedTitle = location.pathname.replace(/\W/g, " ");
    setTitle(parsedTitle);
  }, [location]);

  return (
    <ErrorBoundary>
    <StoreProvider>
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="nb">
      <PermanentDrawerLeft title={title} />
      <Outlet />
    </LocalizationProvider>
    </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
