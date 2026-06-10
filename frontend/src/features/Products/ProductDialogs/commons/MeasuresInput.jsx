// src/components/Expenses/ProductDialogs/AddProductDialog/MeasuresInput.js
import React from "react";
import CreatableSelect from "react-select/creatable";
import PropTypes from "prop-types";

const MeasuresInput = ({ value, onChange, onCreateOption, selectStyles }) => {
  return (
    <CreatableSelect
      styles={selectStyles}
      options={[]} // or predefined options if you have any
      isMulti
      value={value}
      onChange={onChange}
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) => option.value}
      placeholder="Legg til mål..."
      isClearable
      onCreateOption={onCreateOption}
    />
  );
};

MeasuresInput.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  onCreateOption: PropTypes.func.isRequired,
  selectStyles: PropTypes.object.isRequired,
};

export default React.memo(MeasuresInput);