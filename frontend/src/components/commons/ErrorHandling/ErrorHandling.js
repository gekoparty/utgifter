import React, { useContext } from "react";
import PropTypes from "prop-types"; 
import { Typography } from "@mui/material";
import { StoreContext } from "../../../Store/Store";

const ErrorHandling = ({ resource, loading, field }) => {
  const { state } = useContext(StoreContext);
  const { error, showError, validationErrors } = state;

  const displayError = error?.[resource];
  const validationError = validationErrors?.[resource]?.[field];

  // Only render an error message when showError is true and there's an error to display.
  return (
    <div>
      {showError && (displayError || validationError?.message) && (
        <Typography sx={{ marginTop: 1, fontSize: "0.8rem"}} variant="body1" color="error">
          {displayError || validationError?.message}
        </Typography>
      )}
    </div>
  );
};

ErrorHandling.propTypes = {
  resource: PropTypes.string.isRequired,
  field: PropTypes.string.isRequired,
  loading: PropTypes.bool.isRequired,
};

export default ErrorHandling;



