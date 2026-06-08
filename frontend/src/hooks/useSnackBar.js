import { useCallback, useEffect, useRef, useState } from "react";

const useSnackBar = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const isMounted = useRef(true);
  const reopenTimer = useRef(null);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (reopenTimer.current) {
        clearTimeout(reopenTimer.current);
      }
    };
  }, []);

  const handleSnackbarClose = useCallback((event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  }, []);

  const showSnackbar = useCallback((message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(false);

    if (reopenTimer.current) {
      clearTimeout(reopenTimer.current);
    }

    reopenTimer.current = setTimeout(() => {
      if (isMounted.current) {
        setSnackbarOpen(true);
      }
    }, 100);
  }, []);

  return {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar, // Single function handles all cases
    handleSnackbarClose,
  };
};

export default useSnackBar;
