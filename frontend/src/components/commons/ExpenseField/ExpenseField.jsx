import React from 'react';
import { TextField } from '@mui/material';

const ExpenseField = ({ label, value, onChange, onFocus, type = "text", InputProps, ...props }) => (
  <TextField
    fullWidth
    label={label}
    type={type}
    value={value}
    onChange={onChange}
    onFocus={onFocus}
    InputProps={InputProps}
    {...props}
  />
);

export default ExpenseField;