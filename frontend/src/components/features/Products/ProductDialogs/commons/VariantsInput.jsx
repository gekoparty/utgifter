import React from "react";
import CreatableSelect from "react-select/creatable";

const VariantsInput = ({
  value,
  onChange,
  onCreateOption,
  selectStyles,
  isLoading,
}) => {
  return (
    <CreatableSelect
      isMulti
      isClearable
      placeholder="Varianter (f.eks. Original, Light, Zero)"
      value={value}
      onChange={onChange}
      onCreateOption={onCreateOption}
      styles={selectStyles}
      isLoading={isLoading}
    />
  );
};

export default React.memo(VariantsInput);

