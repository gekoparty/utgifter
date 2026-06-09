import React, { createContext, useReducer } from "react";
import ErrorBoundary from "../components/ErrorBoundary";
import { getFriendlyErrorMessage } from "../components/commons/ErrorHandling/errorMessages";

const initialState = {
  shops: [],
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

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: {} };

    case "FETCH_SUCCESS":
      return { ...state, loading: false, [action.resource]: action.payload };

    case "FETCH_FAILURE":
      return { ...state, loading: false, error: action.payload };

    case "ADD_ITEM": {
      if (!Array.isArray(state[action.resource])) {
        console.error(
          `Resource '${action.resource}' is not an array. Current value:`,
          state[action.resource],
        );
        return state;
      }

      return {
        ...state,
        [action.resource]: [...state[action.resource], action.payload],
      };
    }

    case "DELETE_ITEM":
      return {
        ...state,
        [action.resource]: state[action.resource].filter(
          (item) => item._id !== action.payload,
        ),
      };

    case "UPDATE_ITEM":
      return {
        ...state,
        [action.resource]: state[action.resource].map((item) =>
          item._id === action.payload._id ? action.payload : item,
        ),
      };

    case "SET_ERROR": {
      const resource = action.resource || "server";
      const rawError = action.error ?? { message: "Unknown error" };

      return {
        ...state,
        error: {
          ...state.error,
          [resource]: rawError,
        },
        errorMessage: {
          ...state.errorMessage,
          [resource]: getFriendlyErrorMessage(rawError, resource),
        },
        lastRequest: action.lastRequest
          ? { ...state.lastRequest, [resource]: action.lastRequest }
          : state.lastRequest,
        showError: action.showError ?? true,
      };
    }

    case "RESET_ERROR": {
      const { resource } = action;
      const { [resource]: _, ...restErrors } = state.error;
      const { [resource]: __, ...restMessages } = state.errorMessage;
      const { [resource]: ___, ...restRequests } = state.lastRequest;
      const hasRemaining = Object.keys(restErrors).length > 0;

      return {
        ...state,
        error: restErrors,
        errorMessage: restMessages,
        lastRequest: restRequests,
        showError: hasRemaining,
      };
    }

    case "HIDE_ERROR":
      return {
        ...state,
        error: {},
        errorMessage: {},
        lastRequest: {},
        showError: false,
      };

    case "SET_VALIDATION_ERRORS":
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
        [action.resource]: [],
      };

    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state;
  }
};

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <ErrorBoundary>
      <StoreContext.Provider value={{ state, dispatch }}>
        {children}
      </StoreContext.Provider>
    </ErrorBoundary>
  );
};
