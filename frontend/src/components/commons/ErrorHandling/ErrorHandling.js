import React, { useContext } from "react";
import { Typography } from "@mui/material";
import { StoreContext } from "../../../Store/Store";
import CircularProgress from "@mui/material/CircularProgress";

const ErrorHandling = ({ resource, loading }) => {
  const { state } = useContext(StoreContext);
  const { error, showError, validationErrors } = state;

  const displayError = error?.[resource];
  const validationError = validationErrors?.[resource]?.brandName
  console.log("Display error:", displayError);
  console.log(validationError)

  return (
    <div>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress />
        </div>
      ) : (
        showError && (displayError || validationError) && (
          <Typography sx={{ marginTop: 1 }} variant="body1" color="error">
            {displayError || validationError}
          </Typography>
        )
      )}
    </div>
  );
};

export default ErrorHandling;



