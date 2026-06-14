import { Alert, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useStoreDispatch, useStoreState } from "../../../store/Store";
import { getFriendlyErrorMessage } from "./errorMessages";

const GlobalErrorBanner = () => {
  const state = useStoreState();
  const dispatch = useStoreDispatch();
  const { error, errorMessage, showError } = state;

  const messages =
    errorMessage && Object.keys(errorMessage).length > 0
      ? Object.values(errorMessage).filter(Boolean)
      : Object.entries(error || {})
          .map(([resource, value]) => getFriendlyErrorMessage(value, resource))
          .filter(Boolean);

  const uniqueMessages = [...new Set(messages)];

  if (!showError || uniqueMessages.length === 0) return null;

  return (
    <Box sx={{ px: { xs: 1.5, md: 3 }, pt: { xs: 1.5, md: 2 } }}>
      <Alert
        severity="error"
        action={
          <IconButton
            aria-label="Lukk feilmelding"
            color="inherit"
            size="small"
            onClick={() => dispatch({ type: "HIDE_ERROR" })}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {uniqueMessages.join(" - ")}
      </Alert>
    </Box>
  );
};

export default GlobalErrorBanner;

