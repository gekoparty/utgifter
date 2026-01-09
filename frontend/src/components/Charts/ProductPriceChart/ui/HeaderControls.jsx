import React from "react";
import { Box, Typography, Stack, ToggleButtonGroup, ToggleButton, FormControlLabel, Switch } from "@mui/material";

export default function HeaderControls({
  productNameStr,
  mode,
  setMode,
  includeDiscounts,
  setIncludeDiscounts,
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
      <Typography variant="h5" sx={{ minWidth: 220 }}>
        {productNameStr} — Prisutvikling
      </Typography>

      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <ToggleButtonGroup
          size="small"
          value={mode}
          exclusive
          onChange={(_, v) => v && setMode(v)}
          aria-label="chart mode"
        >
          <ToggleButton value="overview">Oversikt</ToggleButton>
          <ToggleButton value="shops">Butikker</ToggleButton>
          <ToggleButton value="distribution">Fordeling</ToggleButton>
        </ToggleButtonGroup>

        <FormControlLabel
          control={<Switch checked={includeDiscounts} onChange={(e) => setIncludeDiscounts(e.target.checked)} />}
          label="Inkluder tilbudspriser"
        />
      </Stack>
    </Box>
  );
}
