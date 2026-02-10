import React, { memo } from "react";
import PropTypes from "prop-types";
import { Card, CardContent, MenuItem, Stack, TextField, Typography } from "@mui/material";

const OPTIONS = [0, 3, 6, 12, 18, 24];

function PastMonthsSelect({ value, onChange }) {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Stack spacing={1}>
          <Typography fontWeight={800}>Historikk</Typography>
          <Typography variant="body2" color="text.secondary">
            Velg hvor mange måneder bakover du vil vise.
          </Typography>

          <TextField
            select
            label="Måneder bakover"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            sx={{ width: { xs: "100%", sm: 260 } }}
          >
            {OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>
                {n === 0 ? "Ingen historikk" : `${n} måneder`}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </CardContent>
    </Card>
  );
}

PastMonthsSelect.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default memo(PastMonthsSelect);
