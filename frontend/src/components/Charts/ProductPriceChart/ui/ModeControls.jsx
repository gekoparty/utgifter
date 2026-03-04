// src/components/Charts/ProductPriceChart/ui/ModeControls.jsx
import React from "react";
import {
  Box,
  Typography,
  Stack,
  Slider,
  Autocomplete,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";

export default function ModeControls({
  mode,

  // overview
  overviewBucket,
  setOverviewBucket,

  // shops
  topN,
  setTopN,
  shops,
  visibleShops,
  setVisibleShops,
  hiddenSeries,
  setHiddenSeries,
  stopScrollBubble,

  // ✅ yearly
  yearlyBreakdown,
  setYearlyBreakdown,
  yearlyTopN,
  setYearlyTopN,
  yearlySeriesCatalog, // [{name,count}]
  visibleYearSeries,
  setVisibleYearSeries,
}) {
  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap", alignItems: "center" }}>
      {mode === "overview" && (
        <ToggleButtonGroup size="small" value={overviewBucket} exclusive onChange={(_, v) => v && setOverviewBucket(v)}>
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

      {/* ✅ yearly */}
      {mode === "yearly" && (
        <>
          <ToggleButtonGroup
            size="small"
            value={yearlyBreakdown}
            exclusive
            onChange={(_, v) => v && setYearlyBreakdown(v)}
          >
            <ToggleButton value="overall">Total</ToggleButton>
            <ToggleButton value="shop">Butikk</ToggleButton>
            <ToggleButton value="variant">Variant</ToggleButton>
            <ToggleButton value="shopVariant">Butikk+Variant</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ width: 240 }}>
            <Typography variant="caption" color="text.secondary">
              Top N serier (standardvisning)
            </Typography>
            <Slider
              value={yearlyTopN}
              onChange={(_, v) => setYearlyTopN(v)}
              step={1}
              min={1}
              max={Math.min(12, yearlySeriesCatalog.length || 12)}
              valueLabelDisplay="auto"
            />
          </Box>

          <Autocomplete
            multiple
            size="small"
            disablePortal
            options={yearlySeriesCatalog.map((s) => s.name)}
            value={visibleYearSeries}
            onChange={(_, v) => setVisibleYearSeries(v)}
            renderInput={(params) => <TextField {...params} label="Velg serier (valgfritt)" />}
            sx={{ minWidth: 360 }}
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
    </Stack>
  );
}