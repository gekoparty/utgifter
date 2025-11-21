import React, { useContext } from "react";
import { Alert, IconButton, Box } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { StoreContext } from "../../../Store/Store";

const GlobalErrorBanner = () => {
  const { state, dispatch } = useContext(StoreContext);
  const { error, errorMessage, showError } = state;

  // Prefer human-friendly messages from errorMessage, fallback to raw error entries
  const messages = [];
  if (errorMessage && Object.keys(errorMessage).length > 0) {
    Object.entries(errorMessage).forEach(([resource, msg]) => {
      if (msg) messages.push(msg);
    });
  } else if (error && Object.keys(error).length > 0) {
    Object.entries(error).forEach(([resource, msg]) => {
      if (msg) messages.push(msg);
    });
  }

  if (!showError || messages.length === 0) return null;

  const handleClose = () => {
    // Reset each resource error and hide the banner
    try {
      Object.keys(error || {}).forEach((res) => {
        dispatch({ type: "RESET_ERROR", resource: res });
        try {
          // Ask react-query to invalidate any queries related to this resource so UI refetches
          queryClient.invalidateQueries([res]);
        } catch (e) {
          // ignore if queryClient not available or no matching queries
        }
      });
      dispatch({ type: "HIDE_ERROR" });
    } catch (e) {
      // ignore
    }
  };

  // No retry action in the global banner; store still contains error details for diagnostics

  return (
    <Box sx={{ mb: 2 }}>
      <Alert
        severity="error"
        action={
          <>
            {/* Retry removed — only dismiss action is available */}
            <IconButton aria-label="dismiss" color="inherit" size="small" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        {messages.join(" — ")}
      </Alert>
    </Box>
  );
};

export default GlobalErrorBanner;
