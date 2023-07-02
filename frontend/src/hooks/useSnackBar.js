import React, { useState, useEffect } from "react";
import { Snackbar, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const useSnackBar = () => {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  
    const handleSnackbarClose = () => {
      setSnackbarOpen(false);
    };
  
    const showSnackbar = (message, severity) => {
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
      setSnackbarOpen(true);
  
      setTimeout(() => {
        setSnackbarOpen(false);
      }, 3000);
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
