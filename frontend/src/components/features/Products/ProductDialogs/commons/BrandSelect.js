// src/components/Expenses/ProductDialogs/Common/BrandSelect.js
import React from "react";
import CreatableSelect from "react-select/creatable";
import PropTypes from "prop-types";
import LinearProgress from "@mui/material/LinearProgress";

const BrandSelect = ({
  options,
  value,
  onChange,
  isLoading,
  error,
  onCreateOption,
  selectStyles,
  onInputChange,          // for filtering
  onMenuScrollToBottom,   // for infinite scroll
  inputValue, // new prop
}) => {
  return (
    <>
      <CreatableSelect
        styles={selectStyles}
        options={options}
        isMulti
        value={value}
        onChange={onChange}
        inputValue={inputValue} // make the input controlled
        getOptionLabel={(option) => option.label || option.name}
        getOptionValue={(option) => option.value}
        placeholder="Velg Merke..."
        isClearable
        onCreateOption={onCreateOption}
        onInputChange={onInputChange} 
        onMenuScrollToBottom={onMenuScrollToBottom}
      />
      {isLoading && <LinearProgress sx={{ mt: 2 }} />}
      {error && <div>Error loading brands</div>}
    </>
  );
};

BrandSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.bool,
  onCreateOption: PropTypes.func.isRequired,
  selectStyles: PropTypes.object.isRequired,
  onInputChange: PropTypes.func,
  onMenuScrollToBottom: PropTypes.func,
  inputValue: PropTypes.string, // new prop type
};

export default React.memo(BrandSelect);


