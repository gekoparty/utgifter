import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import ErrorBoundary from "../components/ErrorBoundary";
import { getFriendlyErrorMessage } from "../components/commons/ErrorHandling/errorMessages";

const PREFERENCES_STORAGE_KEY = "utgifter.appPreferences";
const LEGACY_THEME_STORAGE_KEY = "utgifter.themeMode";
const LEGACY_EXPENSE_COLUMN_VISIBILITY_KEY =
  "expensesTable.columnVisibility.v1";

const readJsonStorage = (key, fallback) => {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const BASE_DEFAULT_PREFERENCES = {
  themeMode: "dark",
  tableDensity: "compact",
  rowsPerPage: 10,
  sidebarOpen: true,
  expenseColumnVisibility: {},
};

const getPreferredThemeMode = () => {
  if (typeof window === "undefined") return "dark";

  try {
    const savedMode = window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    if (savedMode === "light" || savedMode === "dark") return savedMode;
  } catch {
    return "dark";
  }

  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
};

const createDefaultPreferences = () => ({
  ...BASE_DEFAULT_PREFERENCES,
  themeMode: getPreferredThemeMode(),
  expenseColumnVisibility: readJsonStorage(
    LEGACY_EXPENSE_COLUMN_VISIBILITY_KEY,
    {},
  ),
});

const readStoredPreferences = () => {
  const defaultPreferences = createDefaultPreferences();
  if (typeof window === "undefined") return defaultPreferences;

  try {
    const parsed = readJsonStorage(PREFERENCES_STORAGE_KEY, null);
    return {
      ...defaultPreferences,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch {
    return defaultPreferences;
  }
};

const createInitialState = () => ({
  error: {},
  errorMessage: {},
  lastRequest: {},
  validationErrors: {},
  showError: false,
  preferences: readStoredPreferences(),
  notification: null,
});

const reducer = (state, action) => {
  switch (action.type) {
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
      if (!resource) {
        return {
          ...state,
          error: {},
          errorMessage: {},
          lastRequest: {},
          showError: false,
        };
      }

      const { [resource]: _error, ...restErrors } = state.error;
      const { [resource]: _message, ...restMessages } = state.errorMessage;
      const { [resource]: _request, ...restRequests } = state.lastRequest;
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
        showError: action.showError ?? state.showError,
      };

    case "RESET_VALIDATION_ERRORS": {
      if (!action.resource) {
        return { ...state, validationErrors: {} };
      }

      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.resource]: {},
        },
      };
    }

    case "SET_PREFERENCE":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          [action.key]: action.value,
        },
      };

    case "MERGE_PREFERENCES":
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...(action.preferences || {}),
        },
      };

    case "RESET_PREFERENCES":
      return {
        ...state,
        preferences: createDefaultPreferences(),
      };

    case "SHOW_NOTIFICATION":
      return {
        ...state,
        notification: {
          id: action.id ?? Date.now(),
          message: action.message,
          severity: action.severity || "info",
          autoHideDuration: action.autoHideDuration ?? 3000,
        },
      };

    case "HIDE_NOTIFICATION":
      return {
        ...state,
        notification: null,
      };

    default:
      if (import.meta.env.DEV) {
        console.warn(`Unhandled action type: ${action.type}`);
      }
      return state;
  }
};

export const StoreStateContext = createContext(createInitialState());
export const StoreDispatchContext = createContext(() => {});
export const useStoreState = () => useContext(StoreStateContext);
export const useStoreDispatch = () => useContext(StoreDispatchContext);

export const useAppPreferences = () => {
  const { preferences } = useStoreState();
  const dispatch = useStoreDispatch();

  const setPreference = useCallback(
    (key, value) => dispatch({ type: "SET_PREFERENCE", key, value }),
    [dispatch],
  );

  const mergePreferences = useCallback(
    (preferencesToMerge) =>
      dispatch({
        type: "MERGE_PREFERENCES",
        preferences: preferencesToMerge,
      }),
    [dispatch],
  );

  const resetPreferences = useCallback(
    () => dispatch({ type: "RESET_PREFERENCES" }),
    [dispatch],
  );

  return {
    preferences,
    setPreference,
    mergePreferences,
    resetPreferences,
  };
};

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(state.preferences),
    );
  }, [state.preferences]);

  return (
    <ErrorBoundary>
      <StoreDispatchContext.Provider value={dispatch}>
        <StoreStateContext.Provider value={state}>
          {children}
        </StoreStateContext.Provider>
      </StoreDispatchContext.Provider>
    </ErrorBoundary>
  );
};
