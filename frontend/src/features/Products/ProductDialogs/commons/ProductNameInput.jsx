// src/components/Expenses/ProductDialogs/AddProductDialog/ProductNameInput.js
import React from "react";
import TextField from "@mui/material/TextField";
import PropTypes from "prop-types";

const ProductNameInput = ({ value, onChange, error }) => {
  return (
    <TextField
      sx={{ marginTop: 2 }}
      size="small"
      label="Produkt"
      value={value}
      error={Boolean(error)}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
    />
  );
};

ProductNameInput.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.any,
};

export default React.memo(ProductNameInput);