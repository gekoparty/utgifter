import React, { createContext, useReducer } from "react";
import ErrorBoundary from "../components/ErrorBoundary";

// Initial state for the store
const initialState = {
  shops: [
      ],
  brands: [],
  locations: [],
  categories: [
    { _id: "1", name: "Category 1" },
    { _id: "2", name: "Category 2" },
    { _id: "3", name: "Category 3" },
  ],
  loading: false,
  error: {},
  errorMessage: {},
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
  }
};

// Define the updatedErrorState outside the reducer
const getUpdatedErrorState = (state, action) => {
  const errorKey = action.error?.response?.data?.message || "default";
  const errorMessage =
    errorMessageMap[action.resource] &&
    errorMessageMap[action.resource][errorKey]
      ? errorMessageMap[action.resource][errorKey]
      : "An error occurred";

  return {
    ...state.errorMessage,
    [action.resource]: errorMessage,
  };
};

// Reducer function to handle state transitions
const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: {} };
    case "FETCH_SUCCESS":
      
      return { ...state, loading: false, [action.resource]: action.payload };
    case "FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload };
    case "ADD_ITEM":
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
    case "SET_ERROR":
      const updatedErrorState = getUpdatedErrorState(state, action);

      

      return {
        ...state,
        error: updatedErrorState,
        showError: action.showError,
      };
    case "RESET_ERROR":
      const { resource } = action;
      const { [resource]: _, ...restErrors } = state.error;
      return { ...state, error: restErrors };

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
    default:
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

