
import "./App.css";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import PermanentDrawerLeft from "./components/NavBar/PermanentDrawerLeft";

function App() {
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
