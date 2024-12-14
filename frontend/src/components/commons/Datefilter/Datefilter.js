// DateFilter.js
import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Box, TextField } from '@mui/material';

const DateFilter = ({ value, onChange }) => {
  return (
    <Box sx={{ mb: 2 }}>
      <DatePicker
        label="Filter by Date"
        value={value}
        onChange={(newValue) => onChange(newValue)}
        renderInput={(params) => <TextField {...params} />}
      />
    </Box>
  );
};

export default DateFilter;