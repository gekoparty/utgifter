// src/components/.../VariantsInput.jsx
import React from "react";
import CreatableSelect from "react-select/creatable";
import { components } from "react-select";
import LinearProgress from "@mui/material/LinearProgress";
import { useTheme } from "@mui/material/styles";

const CustomControl = ({ children, ...props }) => {
  const theme = useTheme();

  return (
    <div>
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

const VariantsInput = ({
  options = [],
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
      placeholder={isLoading ? "Laster..." : "Varianter (f.eks. Original, Light, Zero)"}
      options={options}
      value={value}
      onChange={onChange}
      onCreateOption={onCreateOption}
      isLoading={isLoading}
      components={{ Control: CustomControl }}
      styles={{
        ...selectStyles,
        control: (base, state) => ({
          ...(selectStyles.control?.(base, state) ?? base),
          minHeight: "40px",
          position: "relative",
        }),
        menuPortal: (base) => ({
          ...(selectStyles.menuPortal?.(base) ?? base),
          zIndex: 9999,
        }),
      }}
      getOptionLabel={(option) => option.label ?? option.name ?? String(option.value ?? "")}
      getOptionValue={(option) => String(option.value ?? "")}
      menuPortalTarget={document.body}
    />
  );
};

export default React.memo(VariantsInput);

