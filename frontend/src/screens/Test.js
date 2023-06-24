import React, { useContext, useEffect } from "react";
import { StoreContext, StoreProvider } from "./YourStoreProvider"; // Replace with the correct import path

const TestComponent = () => {
  const { state, dispatch } = useContext(StoreContext);

  useEffect(() => {
    // Dispatch SET_ERROR action to set an error for "shops" resource
    dispatch({ type: "SET_ERROR", resource: "shops", error: { response: { data: { message: "server" } } } });

    // Dispatch RESET_ERROR action to clear the error for "brands" resource
    dispatch({ type: "RESET_ERROR", resource: "brands" });
  }, [dispatch]);

  return (
    <div>
      <h2>State:</h2>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};

const App = () => (
  <StoreProvider>
    <TestComponent />
  </StoreProvider>
);

export default App;