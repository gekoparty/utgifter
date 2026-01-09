import React from "react";
import {
  Box,
  Typography,
  Stack,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

export default function HeaderControls({
  selectedYear,
  setSelectedYear,
  availableYears,
  comparePreviousYear,
  setComparePreviousYear,
  canComparePrev,
  doCompare,
  previousYearKey,
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mb={1.5}
      gap={2}
      flexWrap="wrap"
    >
      <Box>
        <Typography variant="h6" fontWeight={600}>
          Monthly Expenses
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {doCompare ? `Comparing ${selectedYear} vs. ${previousYearKey}` : `Data for the year ${selectedYear}`}
        </Typography>
      </Box>

      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <FormControlLabel
          control={
            <Switch
              checked={comparePreviousYear}
              onChange={(e) => setComparePreviousYear(e.target.checked)}
              color="primary"
              disabled={!canComparePrev}
            />
          }
          label="Compare Previous Year"
          sx={{ color: "text.secondary" }}
        />

        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="year-select-label">Year</InputLabel>
          <Select
            labelId="year-select-label"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            label="Year"
          >
            {availableYears.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  );
}

