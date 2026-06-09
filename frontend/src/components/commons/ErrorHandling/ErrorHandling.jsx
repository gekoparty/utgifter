// src/commons/ErrorHandling/ErrorHandling.jsx
// (No functional change required; just optional cleanup note: `loading` is unused)
import React, { useContext } from "react";
import PropTypes from "prop-types";
import { Typography } from "@mui/material";
import { StoreContext } from "../../../Store/Store";
import {
  getFriendlyErrorMessage,
  getValidationMessage,
} from "./errorMessages";

const ErrorHandling = ({ resource, field }) => {
  const { state } = useContext(StoreContext);
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


