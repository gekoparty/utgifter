import React from "react";
import CreatableSelect from "react-select/creatable";
import { components } from "react-select";
import PropTypes from "prop-types";
import LinearProgress from "@mui/material/LinearProgress";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const CustomControl = ({ children, ...props }) => {
  const theme = useTheme();

  return (
    <div style={{ position: "relative" }}>
      <components.Control {...props}>
        {children}
        {props.selectProps.isLoading && (
          <LinearProgress
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "2px",
              borderRadius: 0,
              backgroundColor: theme.palette.action.disabledBackground,
              "& .MuiLinearProgress-bar": {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          />
        )}
      </components.Control>
    </div>
  );
};

const CustomMenuList = (props) => {
  const theme = useTheme();
  const { onMenuScrollToBottom, isFetchingNextPage } = props.selectProps;

  const handleScroll = (event) => {
    if (
      event.target.scrollHeight - event.target.scrollTop <=
      event.target.clientHeight + 5
    ) {
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
            paddingBottom: isFetchingNextPage ? "28px" : 0,
          },
        }}
      />
      {isFetchingNextPage && (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            bgcolor: theme.palette.background.paper,
          }}
        >
          <LinearProgress
            sx={{
              height: "2px",
              backgroundColor: theme.palette.action.disabledBackground,
              "& .MuiLinearProgress-bar": {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          />
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
  const theme = useTheme();

  return (
    <CreatableSelect
      styles={{
        ...selectStyles,

        // merge theme control + local overrides
        control: (base, state) => ({
          ...(selectStyles.control?.(base, state) ?? base),
          minHeight: "40px",
          position: "relative",
        }),

        // ensure zIndex is applied without overriding theme
        menuPortal: (base) => ({
          ...(selectStyles.menuPortal?.(base) ?? base),
          zIndex: 9999,
        }),
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
    />
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


