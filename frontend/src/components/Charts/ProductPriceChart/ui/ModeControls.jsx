import React from "react";
import { Box, Typography, Stack, Slider, Autocomplete, TextField, ToggleButtonGroup, ToggleButton, Chip } from "@mui/material";

export default function ModeControls({
  mode,
  overviewBucket,
  setOverviewBucket,
  topN,
  setTopN,
  shops,
  visibleShops,
  setVisibleShops,
  hiddenSeries,
  setHiddenSeries,
  stopScrollBubble,
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap", alignItems: "center" }}>
      {mode === "overview" && (
        <ToggleButtonGroup
          size="small"
          value={overviewBucket}
          exclusive
          onChange={(_, v) => v && setOverviewBucket(v)}
          aria-label="overview bucket"
        >
          <ToggleButton value="week">Uke</ToggleButton>
          <ToggleButton value="month">Måned</ToggleButton>
        </ToggleButtonGroup>
      )}

      {mode === "shops" && (
        <>
          <Box sx={{ width: 220 }}>
            <Typography variant="caption" color="text.secondary">
              Top N butikker (standardvisning)
            </Typography>
            <Slider
              value={topN}
              onChange={(_, v) => setTopN(v)}
              step={1}
              min={1}
              max={Math.min(12, shops.length || 12)}
              valueLabelDisplay="auto"
            />
          </Box>

          <Autocomplete
            multiple
            size="small"
            disablePortal
            options={shops.map((s) => s.name)}
            value={visibleShops}
            onChange={(_, v) => setVisibleShops(v)}
            renderInput={(params) => <TextField {...params} label="Velg butikker (valgfritt)" />}
            sx={{ minWidth: 320 }}
            ListboxProps={{
              onWheel: stopScrollBubble,
              onTouchMove: (e) => e.stopPropagation(),
              style: { maxHeight: 320, overflow: "auto" },
            }}
          />

          {!!hiddenSeries.size && (
            <Chip variant="outlined" label={`${hiddenSeries.size} skjult`} onDelete={() => setHiddenSeries(new Set())} />
          )}
        </>
      )}

      {mode === "distribution" && (
        <Typography variant="body2" color="text.secondary">
          Månedlig fordeling (min / kvartiler / median / maks)
        </Typography>
      )}
    </Stack>
  );
}
