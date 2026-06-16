import React from "react";
import {
  Box,
  Typography,
  Stack,
  Slider,
  Autocomplete,
  TextField,
  Chip,
} from "@mui/material";
import SegmentedControl from "../../../commons/Controls/SegmentedControl";

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
  yearlyBreakdown,
  setYearlyBreakdown,
  yearlyTopN,
  setYearlyTopN,
  yearlySeriesCatalog,
  visibleYearSeries,
  setVisibleYearSeries,
}) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      useFlexGap
      sx={{
        mb: 1.5,
        flexWrap: "wrap",
        alignItems: "center",
        p: 1,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.default",
      }}
    >
      {mode === "overview" && (
        <SegmentedControl
          value={overviewBucket}
          onChange={setOverviewBucket}
          options={[
            { value: "week", label: "Uke" },
            { value: "month", label: "Måned" },
          ]}
          sx={{ "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700 } }}
        />
      )}

      {mode === "shops" && (
        <>
          <Box sx={{ width: { xs: "100%", sm: 220 } }}>
            <Typography variant="caption" color="text.secondary">
              Antall butikker
            </Typography>
            <Slider
              value={topN}
              onChange={(_, value) => setTopN(value)}
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
            options={shops.map((shop) => shop.name)}
            value={visibleShops}
            onChange={(_, value) => setVisibleShops(value)}
            renderInput={(params) => <TextField {...params} label="Velg butikker" />}
            sx={{ width: { xs: "100%", sm: 340 } }}
            ListboxProps={{
              onWheel: stopScrollBubble,
              onTouchMove: (event) => event.stopPropagation(),
              style: { maxHeight: 320, overflow: "auto" },
            }}
          />

          {!!hiddenSeries.size && (
            <Chip
              variant="outlined"
              label={`${hiddenSeries.size} skjult`}
              onDelete={() => setHiddenSeries(new Set())}
            />
          )}
        </>
      )}

      {mode === "distribution" && (
        <Typography variant="body2" color="text.secondary">
          Månedlig fordeling med minimum, kvartiler, median og maksimum.
        </Typography>
      )}

      {mode === "yearly" && (
        <>
          <SegmentedControl
            value={yearlyBreakdown}
            onChange={setYearlyBreakdown}
            options={[
              { value: "overall", label: "Total" },
              { value: "brand", label: "Merke" },
              { value: "shop", label: "Butikk" },
              { value: "variant", label: "Variant" },
              { value: "shopVariant", label: "Butikk + variant" },
            ]}
            sx={{
              flexWrap: "wrap",
              "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700 },
            }}
          />

          <Box sx={{ width: { xs: "100%", sm: 230 } }}>
            <Typography variant="caption" color="text.secondary">
              Antall serier
            </Typography>
            <Slider
              value={yearlyTopN}
              onChange={(_, value) => setYearlyTopN(value)}
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
            options={yearlySeriesCatalog.map((series) => series.name)}
            value={visibleYearSeries}
            onChange={(_, value) => setVisibleYearSeries(value)}
            renderInput={(params) => <TextField {...params} label="Velg serier" />}
            sx={{ width: { xs: "100%", sm: 360 } }}
            ListboxProps={{
              onWheel: stopScrollBubble,
              onTouchMove: (event) => event.stopPropagation(),
              style: { maxHeight: 320, overflow: "auto" },
            }}
          />

          {!!hiddenSeries.size && (
            <Chip
              variant="outlined"
              label={`${hiddenSeries.size} skjult`}
              onDelete={() => setHiddenSeries(new Set())}
            />
          )}
        </>
      )}
    </Stack>
  );
}
