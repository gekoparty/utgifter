import { StoreProvider } from "./store";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomeScreen from "./screens/HomeScreen";
import ScreenRoute1 from "./screens/ScreenRoute1";
import ScreenRoute2 from "./screens/ScreenRoute2";
import "./App.css";

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <div className="App">
          <Routes default="false">
            <Route
              path="/testroute1"
              element={<ScreenRoute1 />}
            />
            <Route
              path="/testroute2"
              element={<ScreenRoute2/>}
            />
            <Route path="/" element={<HomeScreen />} />
          </Routes>
        </div>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
