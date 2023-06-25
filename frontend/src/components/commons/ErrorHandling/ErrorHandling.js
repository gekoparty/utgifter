import React, { useContext } from "react";
import { Typography } from "@mui/material";
import { StoreContext } from "../../../Store/Store";

const ErrorHandling = ({ resource }) => {
  const { state } = useContext(StoreContext);
  const { error, errorMessage } = state;

  // Retrieve the error message from the errorMessage object
  const displayError = error && error[resource];

  // Retrieve the resource error message from the errorMessage object
  const resourceErrorMessage =
    displayError && errorMessage && errorMessage[resource]
      ? errorMessage[resource]
      : "An error occurred";

  console.log("displayError:", displayError);
  console.log("errorMessage:", errorMessage);
  console.log("resourceErrorMessage:", resourceErrorMessage);

  return displayError ? (
    <Typography sx={{ marginTop: 1 }} variant="body1" color="error">
      {displayError}
    </Typography>
  ) : null;
};

export default ErrorHandling;


