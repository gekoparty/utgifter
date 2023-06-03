
import "./App.css";
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import PermanentDrawerLeft from "./components/NavBar/PermanentDrawerLeft";

function App({children}) {
  const [title, setTitle] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const parsedTitle = location.pathname.replace(/\W/g, " ");
    setTitle(parsedTitle);
  }, [location]);

  return (
    <>
      <PermanentDrawerLeft title={title} />
      <Outlet />
    </>
  );
}

export default App;
