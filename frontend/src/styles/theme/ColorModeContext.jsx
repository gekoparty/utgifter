import { createContext, useContext } from "react";

export const ColorModeContext = createContext({
  mode: "dark",
  toggleColorMode: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}
