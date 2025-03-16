// src/components/Expenses/ProductDialogs/Common/BrandSelect.js
import React from "react";
import CreatableSelect from "react-select/creatable";
import { components } from "react-select"; // import base components
import PropTypes from "prop-types";
import LinearProgress from "@mui/material/LinearProgress";

// Custom MenuList that listens for scroll events.
const CustomMenuList = (props) => {
  const { onMenuScrollToBottom } = props.selectProps;
  
  const handleScroll = (event) => {
    const target = event.target;
    // If near the bottom (tolerance of 5px), trigger fetching more brands.
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 5) {
      if (onMenuScrollToBottom) {
        onMenuScrollToBottom();
      }
    }
  };

  return (
    <components.MenuList {...props}>
      <div onScroll={handleScroll} style={{ maxHeight: "200px", overflowY: "auto" }}>
        {props.children}
      </div>
    </components.MenuList>
  );
};

const BrandSelect = ({
  options,
  value,
  onChange,
  isLoading,
  error,
  onCreateOption,
  selectStyles,
  onInputChange,
  onMenuScrollToBottom,
  inputValue,
}) => {
  return (
    <>
      <CreatableSelect
        styles={selectStyles}
        options={options}
        isMulti
        value={value}
        onChange={onChange}
        inputValue={inputValue}
        onInputChange={onInputChange}
        // Use the custom MenuList with scroll listener.
        components={{ MenuList: CustomMenuList }}
        // Pass the scroll handler so that CustomMenuList can trigger it.
        onMenuScrollToBottom={onMenuScrollToBottom}
        getOptionLabel={(option) => option.label || option.name}
        getOptionValue={(option) => option.value}
        placeholder="Velg Merke..."
        isClearable
        onCreateOption={onCreateOption}
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
  inputValue: PropTypes.string,
};

export default React.memo(BrandSelect);



