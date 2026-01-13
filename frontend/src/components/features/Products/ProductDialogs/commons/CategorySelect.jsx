import React from "react";
import Select from "react-select";

const CategorySelect = ({ options, value, onChange, selectStyles, isLoading }) => {
  return (
    <Select
      options={options}
      value={value}
      onChange={onChange}
      styles={selectStyles}
      isLoading={isLoading}
      isClearable
      placeholder="Kategori"
    />
  );
};

export default React.memo(CategorySelect);
