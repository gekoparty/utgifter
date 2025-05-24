import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

/*
  :contentReference[oaicite:0]{index=0}:
  We create an Intl.NumberFormat instance with style 'currency', currency 'NOK',
  and fixed fraction digits (min & max both 2) to format numbers in 'nb-NO' locale.
  Using Intl.NumberFormat.format() is more efficient than Number.toLocaleString
  when called repeatedly, because the formatter can cache locale data.
*/
const formatNOK = new Intl.NumberFormat('nb-NO', {
  style: 'currency',
  currency: 'NOK',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CurrencyBox = ({ value, emptyPlaceholder }) => {
  /*
    :contentReference[oaicite:1]{index=1}:
    useMemo lets us memoize the formatted string so that if `value` doesn't
    change, we don’t recompute formatNOK.format(value) on each render.
  */
  const display = useMemo(() => {
    if (value == null || isNaN(value)) {
      return emptyPlaceholder;
    }
    return formatNOK.format(value);
  }, [value, emptyPlaceholder]);

  return (
    <Box component="span" aria-label={typeof value === 'number' ? display : 'no value'}>
      {display}
    </Box>
  );
};

/*
  :contentReference[oaicite:2]{index=2}:
  Wrapping in React.memo prevents unnecessary re-renders when props (here: `value`
  or `emptyPlaceholder`) are unchanged.
*/
export default React.memo(CurrencyBox);

CurrencyBox.propTypes = {
  value: PropTypes.number,
  emptyPlaceholder: PropTypes.node,
};

CurrencyBox.defaultProps = {
  value: null,
  emptyPlaceholder: '–',
};