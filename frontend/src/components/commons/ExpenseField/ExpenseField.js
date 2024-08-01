import React from 'react';
import { TextField } from '@mui/material';

const ExpenseField = ({ label, value, onChange, type = "text", InputProps, ...props }) => (
  <TextField
    fullWidth
    label={label}
    type={type}
    value={value}
    onChange={onChange}
    InputProps={InputProps}
    {...props}
  />
);

export default ExpenseField;