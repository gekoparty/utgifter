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
  showExtraCharts,
  setShowExtraCharts,
}) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      mb={2.5}
      gap={2}
      flexWrap="wrap"
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.15 }}>
          Månedlige utgifter
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {doCompare
            ? `${selectedYear} sammenlignet med ${previousYearKey}`
            : `Tall for ${selectedYear}`}
        </Typography>
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ width: { xs: "100%", sm: "auto" } }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={comparePreviousYear}
              onChange={(event) => setComparePreviousYear(event.target.checked)}
              color="primary"
              disabled={!canComparePrev}
            />
          }
          label="Sammenlign med fjoråret"
          sx={{
            color: "text.secondary",
            m: 0,
            px: 1.25,
            py: 0.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={showExtraCharts}
              onChange={(event) => setShowExtraCharts(event.target.checked)}
              color="primary"
            />
          }
          label="Ekstra grafer"
          sx={{
            color: "text.secondary",
            m: 0,
            px: 1.25,
            py: 0.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        />

        <FormControl
          variant="outlined"
          size="small"
          sx={{ minWidth: { xs: "100%", sm: 130 } }}
        >
          <InputLabel id="year-select-label">År</InputLabel>
          <Select
            labelId="year-select-label"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            label="År"
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
