import React from "react";
import CreatableSelect from "react-select/creatable";
import { components } from "react-select";
import PropTypes from "prop-types";
import LinearProgress from "@mui/material/LinearProgress";
import { Box } from "@mui/material";

// Custom Control that shows a LinearProgress when loading.
const CustomControl = ({ children, ...props }) => {
  return (
    <div style={{ position: 'relative' }}>
      <components.Control {...props}>
        {children}
        {props.selectProps.isLoading && (
          <LinearProgress 
            sx={{ 
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              borderRadius: 0
            }} 
          />
        )}
      </components.Control>
    </div>
  );
};

// Custom MenuList that listens for scroll events and reserves space for a loading indicator.
const CustomMenuList = (props) => {
  const { onMenuScrollToBottom, isFetchingNextPage } = props.selectProps;

  const handleScroll = (event) => {
    const target = event.target;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 5) {
      onMenuScrollToBottom?.();
    }
  };

  return (
    <>
      <components.MenuList
        {...props}
        innerProps={{
          ...props.innerProps,
          onScroll: handleScroll,
          style: { 
            ...props.innerProps.style, 
            maxHeight: "200px", 
            overflowY: "auto",
            paddingBottom: isFetchingNextPage ? '28px' : 0 
          },
        }}
      />
      {isFetchingNextPage && (
        <Box sx={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          p: 1,
          bgcolor: 'background.paper'
        }}>
          <LinearProgress sx={{ height: '2px' }} />
        </Box>
      )}
    </>
  );
};

const BrandSelect = ({
  options,
  value,
  onChange,
  onCreateOption,
  selectStyles,
  onInputChange,
  onMenuScrollToBottom,
  inputValue,
  isLoading,
}) => {
  return (
    <>
      <CreatableSelect
        styles={{
          ...selectStyles,
          control: (base) => ({
            ...base,
            minHeight: '40px',
            position: 'relative',
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
        options={options}
        isMulti
        value={value}
        onChange={onChange}
        inputValue={inputValue}
        onInputChange={onInputChange}
        components={{ 
          MenuList: CustomMenuList,
          Control: CustomControl,
        }}
        isLoading={isLoading}
        placeholder={isLoading ? "Laster..." : "Velg Merke..."}
        onMenuScrollToBottom={onMenuScrollToBottom}
        getOptionLabel={(option) => option.label || option.name}
        getOptionValue={(option) => option.value}
        isClearable
        onCreateOption={onCreateOption}
        menuPortalTarget={document.body}
        // Pass pagination loading indicator if using:
      />
    </>
  );
};

BrandSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onCreateOption: PropTypes.func.isRequired,
  selectStyles: PropTypes.object.isRequired,
  onInputChange: PropTypes.func,
  onMenuScrollToBottom: PropTypes.func,
  inputValue: PropTypes.string,
 
};

export default React.memo(BrandSelect);


