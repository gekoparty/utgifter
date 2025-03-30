import React from 'react';
import { Box } from '@mui/material';

const CurrencyBox = ({ value }) => (
  <Box component="span">
    {value?.toLocaleString('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </Box>
);

export default CurrencyBox;