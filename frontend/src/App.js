import { StoreProvider } from "./store";
import "./App.css";
import Grid from "@mui/material/Grid";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import PermanentDrawerLeft from "./components/NavBar/PermanentDrawerLeft";

function App() {
  const [title, setTitle] = useState(null);
  const location = useLocation();
  const [drawerWidth, setDrawerWidth] = useState(240);

  useEffect(() => {
    const parsedTitle = location.pathname.replace(/\W/g, " ");
    setTitle(parsedTitle);
  }, [location]);

  return (
    <Grid container>
      <Grid item>
        <PermanentDrawerLeft title={title} />
      </Grid>
      <Grid item xs={12} sx={{ marginLeft: { sm: drawerWidth } }}>
        <Outlet />
      </Grid>
    </Grid>
  );
}

export default App;
