import React from "react";
import CreatableSelect from "react-select/creatable";

const CategorySelect = ({
  options,
  value,
  onChange,
  onCreateOption,
  selectStyles,
  isLoading,
}) => {
  return (
    <CreatableSelect
      options={options}
      value={value}
      onChange={onChange}
      onCreateOption={onCreateOption}
      styles={selectStyles}
      isLoading={isLoading}
      isClearable
      placeholder="Produktkategori"
      isValidNewOption={(input) => {
        const value = input.trim();
        return !!value && !options.some((option) => option.label === value);
      }}
      formatCreateLabel={(input) => `Ny produktkategori: ${input}`}
    />
  );
};

export default React.memo(CategorySelect);
