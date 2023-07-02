import React, { useContext } from "react";
import { Typography } from "@mui/material";
import { StoreContext } from "../../../Store/Store";

const ErrorHandling = ({ resource }) => {
  const { state } = useContext(StoreContext);
  const { error, showError } = state;

  const displayError = error?.[resource];
  console.log("Display error:", displayError);

  return showError && displayError && (
    <Typography sx={{ marginTop: 1 }} variant="body1" color="error">
      {displayError}
    </Typography>
  );
};

export default ErrorHandling;



