import React from "react";
import PropTypes from "prop-types";
import { Typography } from "@mui/material";

export default function DeleteConfirmation({ name, resourceLabel, impactText }) {
  return (
    <Typography>
      Er du sikker på at du vil slette{" "}
      {resourceLabel ? `${resourceLabel} ` : null}
      <strong>"{name || "Ukjent"}"</strong>?{impactText ? ` ${impactText}` : ""}
    </Typography>
  );
}

DeleteConfirmation.propTypes = {
  name: PropTypes.string,
  resourceLabel: PropTypes.string,
  impactText: PropTypes.string,
};
