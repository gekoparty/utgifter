import { createAuthClient } from "better-auth/react";
import { API_URL } from "../components/commons/Consts/constants";

export const authClient = createAuthClient({
  baseURL: API_URL || window.location.origin,
  fetchOptions: {
    credentials: "include",
  },
});
