import { useState } from "react";

const useSnackBar = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };


  const showSnackbar = (message, severity) => {
    setSnackbarOpen(false);
    // Queue the new message
    setTimeout(() => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
    }, 100);

  };

  const showSuccessSnackbar = (message) => {
    showSnackbar(message, "success");
  };

  const showErrorSnackbar = (message) => {
    showSnackbar(message, "error");
  };

  return {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  };
};

export default useSnackBar;
