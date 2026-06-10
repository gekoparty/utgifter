import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Box } from "@mui/material";

const formatNOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CurrencyBox = ({ value = null, emptyPlaceholder = "-" }) => {
  const display = useMemo(() => {
    if (value == null || Number.isNaN(Number(value))) {
      return emptyPlaceholder;
    }
    return formatNOK.format(value);
  }, [value, emptyPlaceholder]);

  return (
    <Box
      component="span"
      aria-label={typeof value === "number" ? display : "no value"}
    >
      {display}
    </Box>
  );
};

CurrencyBox.propTypes = {
  value: PropTypes.number,
  emptyPlaceholder: PropTypes.node,
};

export default React.memo(CurrencyBox);
