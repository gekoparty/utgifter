import React, { createContext, useReducer } from "react";
import ErrorBoundary from "../components/ErrorBoundary";

// Initial state for the store
const initialState = {
  shops: [
      ],
  brands: [],
  locations: [],
  categories: [],
  products: [],
  expenses: [],
  loading: false,
  error: {},
  errorMessage: {},
  lastRequest: {},
  validationErrors: {},
  showError: false,
};

const errorMessageMap = {
  brands: {
    duplicate: "Dette merket eksisterer allerede",
    server: "Noe gikk galt, prøv igjen",
  },
  categories: {
    duplicate: "Denne kategorien eksisterer allerede",
    server: "Noe gikk galt, prøv igjen",
  },
  shops: {
    duplicate: "Denne butikken eksisterer allerede",
    server: "Noe gikk galt, prøv igjen",
  },
  locations: {
    duplicate: "Denne butikken eksisterer allerede",
    server: "Noe gikk galt, prøv igjen",
  },
  products: {
    duplicate: "Denne butikken eksisterer allerede",
    server: "Noe gikk galt, prøv igjen",
  },
  expenses: {
    server: "Noe gikk galt, prøv igjen",
  },
};

// Helper to map a normalized error to a friendly message for the UI
const getFriendlyMessage = (resource, actionError) => {
  // actionError may be normalized ({ message, status, data }) or an axios error
  const errorKey = actionError?.message || actionError?.data?.message || actionError?.response?.data?.message || "server";
  return (
    (errorMessageMap[resource] && errorMessageMap[resource][errorKey]) ||
    (errorMessageMap[resource] && errorMessageMap[resource]["server"]) ||
    "An error occurred"
  );
};

// Reducer function to handle state transitions

const reducer = (state, action) => {
  //console.log("Reducer action:", action);
  //console.log("Current state:", state);

  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: {} };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, [action.resource]: action.payload };
    case "FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload };
    case "ADD_ITEM":
      if (!Array.isArray(state[action.resource])) {
        console.error(`Resource '${action.resource}' is not an array. Current value:`, state[action.resource]);
        return state; // Return the current state to prevent breaking the app
      }
      const updatedItems = [...state[action.resource], action.payload];
      console.log("Updated", action.resource, "Array:", updatedItems);
      return { ...state, [action.resource]: updatedItems };
    case "DELETE_ITEM":
      return {
        ...state,
        [action.resource]: state[action.resource].filter(
          (item) => item._id !== action.payload
        ),
      };
    case "UPDATE_ITEM":
      return {
        ...state,
        [action.resource]: state[action.resource].map((item) =>
          item._id === action.payload._id ? action.payload : item
        ),
      };
    case "SET_ERROR": {
      const rawError = action.error ?? { message: action.error?.message ?? "Unknown error" };
      const friendly = getFriendlyMessage(action.resource, action.error);
      return {
        ...state,
        error: {
          ...state.error,
          [action.resource]: rawError,
        },
        errorMessage: {
          ...state.errorMessage,
          [action.resource]: friendly,
        },
        showError: action.showError,
      };
    }
    case "RESET_ERROR": {
      const { resource } = action;
      const { [resource]: _, ...restErrors } = state.error;
      const { [resource]: __, ...restMessages } = state.errorMessage;
      const hasRemaining = Object.keys(restErrors).length > 0;
      return { ...state, error: restErrors, errorMessage: restMessages, showError: hasRemaining };
    }
    case "SET_VALIDATION_ERRORS":
      console.log("Validation Errors:", action.validationErrors);
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.resource]: action.validationErrors,
        },
        showError: action.showError,
      };
    case "RESET_VALIDATION_ERRORS":
      return {
        ...state,
        validationErrors: { ...state.validationErrors, [action.resource]: {} },
      };
    case "CLEAR_RESOURCE":
      return {
        ...state,
        [action.resource]: [], // Clear the resource data
      };
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state;
  }
};

// Create the store context
export const StoreContext = createContext();

// Store provider component
export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ErrorBoundary error={state.error}>
      <StoreContext.Provider value={{ state, dispatch }}>
        {children}
      </StoreContext.Provider>
    </ErrorBoundary>
  );
};

