// src/components/Charts/ProductPriceChart/ui/HeaderControls.jsx
import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  FormControlLabel,
  Switch,
  Autocomplete,
  TextField,
  Chip,
} from "@mui/material";

export default function HeaderControls({
  productNameStr,
  mode,
  setMode,
  includeDiscounts,
  setIncludeDiscounts,

  variants = [], // [{ id, name }]
  selectedVariantIds = [], // [] => all
  setSelectedVariantIds,
}) {
  const selectedVariantObjects = useMemo(() => {
    if (!selectedVariantIds?.length) return [];
    const set = new Set(selectedVariantIds);
    return variants.filter((v) => set.has(v.id));
  }, [variants, selectedVariantIds]);

  const showVariantSelector = Array.isArray(variants) && variants.length > 0;

  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
      <Typography variant="h5" sx={{ minWidth: 220 }}>
        {productNameStr} — Prisutvikling
      </Typography>

      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
        <ToggleButtonGroup size="small" value={mode} exclusive onChange={(_, v) => v && setMode(v)}>
          <ToggleButton value="overview">Oversikt</ToggleButton>
          <ToggleButton value="shops">Butikker</ToggleButton>
          <ToggleButton value="distribution">Fordeling</ToggleButton>
          <ToggleButton value="yearly">År</ToggleButton>
        </ToggleButtonGroup>

        <FormControlLabel
          control={<Switch checked={includeDiscounts} onChange={(e) => setIncludeDiscounts(e.target.checked)} />}
          label="Inkluder tilbudspriser"
        />

        {showVariantSelector && (
          <>
            <Autocomplete
              multiple
              size="small"
              disablePortal
              options={variants}
              getOptionLabel={(o) => o?.name ?? ""}
              value={selectedVariantObjects}
              onChange={(_, arr) => setSelectedVariantIds(arr.map((x) => x.id))}
              renderInput={(params) => <TextField {...params} label="Varianter (valgfritt)" />}
              sx={{ minWidth: 320 }}
            />
            {!selectedVariantIds?.length && <Chip variant="outlined" label="Alle varianter" />}
          </>
        )}
      </Stack>
    </Box>
  );
}