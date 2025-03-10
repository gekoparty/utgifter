// src/components/Expenses/ProductDialogs/AddProductDialog/MeasurementUnitSelect.js
import React from "react";
import Select from "react-select";
import PropTypes from "prop-types";

const MeasurementUnitSelect = ({ options, value, onChange, selectStyles }) => {
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

MeasurementUnitSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  selectStyles: PropTypes.object.isRequired,
};

export default React.memo(MeasurementUnitSelect);