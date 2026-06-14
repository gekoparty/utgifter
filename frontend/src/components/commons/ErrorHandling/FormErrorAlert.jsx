import PropTypes from "prop-types";
import { Alert } from "@mui/material";
import { useStoreState } from "../../../store/Store";
import { getFriendlyErrorMessage } from "./errorMessages";

const FormErrorAlert = ({ resource }) => {
  const { error, errorMessage, showError } = useStoreState();
  const displayError = error?.[resource];
  const message =
    errorMessage?.[resource] ||
    (displayError ? getFriendlyErrorMessage(displayError, resource) : "");

  if (!showError || !message) return null;

  return (
    <Alert severity="error" variant="outlined" sx={{ fontSize: "0.85rem" }}>
      {message}
    </Alert>
  );
};

FormErrorAlert.propTypes = {
  resource: PropTypes.string.isRequired,
};

export default FormErrorAlert;
