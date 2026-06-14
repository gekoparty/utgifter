import PropTypes from "prop-types";
import { Typography } from "@mui/material";
import { useStoreState } from "../../../store/Store";
import { getValidationMessage } from "./errorMessages";

const FieldErrorText = ({ resource, field }) => {
  const { showError, validationErrors } = useStoreState();
  const validationError = validationErrors?.[resource]?.[field];
  const message = getValidationMessage(validationError);

  if (!showError || !message) return null;

  return (
    <Typography
      sx={{ mt: 0.5, fontSize: "0.8rem" }}
      variant="body1"
      color="error"
    >
      {message}
    </Typography>
  );
};

FieldErrorText.propTypes = {
  resource: PropTypes.string.isRequired,
  field: PropTypes.string.isRequired,
};

export default FieldErrorText;
