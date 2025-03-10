// src/components/Expenses/ProductDialogs/AddProductDialog/ProductTypeSelect.js
import React from "react";
import Select from "react-select";
import PropTypes from "prop-types";

const ProductTypeSelect = ({ options, value, onChange, selectStyles }) => {
  return (
    <Select
      styles={selectStyles}
      options={options}
      value={value}
      onChange={onChange}
      isClearable
    />
  );
};

ProductTypeSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  selectStyles: PropTypes.object.isRequired,
};

export default React.memo(ProductTypeSelect);