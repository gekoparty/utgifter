import React, { useContext } from "react";
import { Typography } from "@mui/material";
import { StoreContext } from "../../../Store/Store";
import CircularProgress from "@mui/material/CircularProgress";

const ErrorHandling = ({ resource, loading }) => {
  const { state } = useContext(StoreContext);
  const { error, showError } = state;

  const displayError = error?.[resource];
  console.log("Display error:", displayError);

  return (
    <div>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress />
        </div>
      ) : (
        showError && displayError && (
          <Typography sx={{ marginTop: 1 }} variant="body1" color="error">
            {displayError}
          </Typography>
        )
      )}
    </div>
  );
};

export default ErrorHandling;



