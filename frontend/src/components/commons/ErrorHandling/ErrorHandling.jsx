import PropTypes from "prop-types";
import { Alert, Typography } from "@mui/material";
import { useStoreState } from "../../../store/Store";
import {
  getFriendlyErrorMessage,
  getValidationMessage,
} from "./errorMessages";

const ErrorHandling = ({ resource, field, showResourceError = false }) => {
  const state = useStoreState();
  const { error, errorMessage, showError, validationErrors } = state;

  const displayError = error?.[resource];
  const validationError = field ? validationErrors?.[resource]?.[field] : null;
  const validationMessage = getValidationMessage(validationError);
  const resourceMessage =
    errorMessage?.[resource] ||
    (displayError ? getFriendlyErrorMessage(displayError, resource) : "");
  const message = validationMessage || (showResourceError ? resourceMessage : "");

  if (!showError || !message) return null;

  if (showResourceError && !validationMessage) {
    return (
      <Alert severity="error" variant="outlined" sx={{ fontSize: "0.85rem" }}>
        {message}
      </Alert>
    );
  }

  return (
    <Typography
      sx={{ marginTop: 0.5, fontSize: "0.8rem" }}
      variant="body1"
      color="error"
    >
      {message}
    </Typography>
  );
};

ErrorHandling.propTypes = {
  resource: PropTypes.string.isRequired,
  field: PropTypes.string,
  showResourceError: PropTypes.bool,
};

export default ErrorHandling;


