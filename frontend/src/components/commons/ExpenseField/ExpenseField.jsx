import { TextField } from "@mui/material";

const ExpenseField = ({
  label,
  value,
  onChange,
  onFocus,
  type = "text",
  InputProps,
  inputProps,
  InputLabelProps,
  slotProps,
  ...props
}) => {
  const textFieldSlotProps = {
    ...slotProps,
    input: {
      ...InputProps,
      ...slotProps?.input,
    },
    htmlInput: {
      ...inputProps,
      ...slotProps?.htmlInput,
    },
    inputLabel: {
      ...InputLabelProps,
      ...slotProps?.inputLabel,
    },
  };

  return (
    <TextField
      fullWidth
      label={label}
      type={type}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      slotProps={textFieldSlotProps}
      {...props}
    />
  );
};

export default ExpenseField;
