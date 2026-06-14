import { Alert, IconButton, Snackbar } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useCallback } from "react";
import { useStoreDispatch, useStoreState } from "../../../store/Store";

export default function GlobalNotificationSnackbar() {
  const { notification } = useStoreState();
  const dispatch = useStoreDispatch();

  const handleClose = useCallback(
    (event, reason) => {
      if (reason === "clickaway") return;
      dispatch({ type: "HIDE_NOTIFICATION" });
    },
    [dispatch],
  );

  return (
    <Snackbar
      key={notification?.id}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      open={Boolean(notification?.message)}
      autoHideDuration={notification?.autoHideDuration ?? 3000}
      onClose={handleClose}
    >
      <Alert
        severity={notification?.severity || "info"}
        onClose={handleClose}
        variant="filled"
        action={
          <IconButton
            aria-label="Lukk melding"
            size="small"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {notification?.message}
      </Alert>
    </Snackbar>
  );
}
