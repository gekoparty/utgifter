import { Alert, IconButton, Snackbar } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function ExpenseSnackbar({
  message,
  onClose,
  open,
  severity,
}) {
  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
    >
      <Alert
        severity={severity}
        onClose={onClose}
        variant="filled"
        action={
          <IconButton size="small" color="inherit" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
