import { useCallback } from "react";
import { useStoreDispatch } from "../store/Store";

const useSnackBar = () => {
  const dispatch = useStoreDispatch();

  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === "clickaway") return;
    dispatch({ type: "HIDE_NOTIFICATION" });
  }, [dispatch]);

  const showSnackbar = useCallback(
    (message, severity = "success", options = {}) => {
      dispatch({
        type: "SHOW_NOTIFICATION",
        message,
        severity,
        autoHideDuration: options.autoHideDuration,
      });
    },
    [dispatch],
  );

  return {
    snackbarOpen: false,
    snackbarMessage: "",
    snackbarSeverity: "success",
    showSnackbar,
    handleSnackbarClose,
  };
};

export default useSnackBar;
