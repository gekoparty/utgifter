import PropTypes from "prop-types";
import { Typography } from "@mui/material";
import { useStoreState } from "../../../store/Store";
import {
  getFriendlyErrorMessage,
  getValidationMessage,
} from "./errorMessages";

const ErrorHandling = ({ resource, field }) => {
  const state = useStoreState();
  const { error, errorMessage, showError, validationErrors } = state;

  const displayError = error?.[resource];
  const validationError = validationErrors?.[resource]?.[field];
  const message =
    errorMessage?.[resource] ||
    getValidationMessage(validationError) ||
    (displayError ? getFriendlyErrorMessage(displayError, resource) : "");

  return (
    <div>
      {showError && message && (
        <Typography
          sx={{ marginTop: 1, fontSize: "0.8rem" }}
          variant="body1"
          color="error"
        >
          {message}
        </Typography>
      )}
    </div>
  );
};

ErrorHandling.propTypes = {
  resource: PropTypes.string.isRequired,
  field: PropTypes.string.isRequired,
};

export default ErrorHandling;


