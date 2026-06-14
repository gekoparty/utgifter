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
  productCategory,
  mode,
  setMode,
  includeDiscounts,
  setIncludeDiscounts,
  variants = [],
  selectedVariantIds = [],
  setSelectedVariantIds,
}) {
  const selectedVariantObjects = useMemo(() => {
    if (!selectedVariantIds?.length) return [];
    const set = new Set(selectedVariantIds);
    return variants.filter((variant) => set.has(variant.id));
  }, [variants, selectedVariantIds]);

  const showVariantSelector = Array.isArray(variants) && variants.length > 0;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "stretch", md: "center" },
        flexDirection: { xs: "column", md: "row" },
        mb: 1.5,
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.15 }}>
          {productNameStr}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mt: 0.4 }}>
          <Typography variant="body2" color="text.secondary">
            Prisutvikling og butikkhistorikk
          </Typography>
          {productCategory ? (
            <Chip size="small" variant="outlined" label={productCategory} sx={{ height: 24 }} />
          ) : null}
        </Stack>
      </Box>

      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: { xs: "flex-start", md: "flex-end" },
        }}
      >
        <ToggleButtonGroup
          size="small"
          value={mode}
          exclusive
          onChange={(_, value) => value && setMode(value)}
          sx={{
            flexWrap: "wrap",
            "& .MuiToggleButton-root": { textTransform: "none", fontWeight: 700 },
          }}
        >
          <ToggleButton value="overview">Oversikt</ToggleButton>
          <ToggleButton value="shops">Butikker</ToggleButton>
          <ToggleButton value="distribution">Fordeling</ToggleButton>
          <ToggleButton value="yearly">År</ToggleButton>
        </ToggleButtonGroup>

        <FormControlLabel
          control={<Switch checked={includeDiscounts} onChange={(event) => setIncludeDiscounts(event.target.checked)} />}
          label="Tilbudspriser"
          sx={{
            m: 0,
            px: 1.25,
            py: 0.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            color: "text.secondary",
          }}
        />

        {showVariantSelector && (
          <>
            <Autocomplete
              multiple
              size="small"
              disablePortal
              options={variants}
              getOptionLabel={(option) => option?.name ?? ""}
              value={selectedVariantObjects}
              onChange={(_, selected) => setSelectedVariantIds(selected.map((variant) => variant.id))}
              renderInput={(params) => <TextField {...params} label="Varianter" />}
              sx={{ width: { xs: "100%", sm: 320 } }}
            />
            {!selectedVariantIds?.length && <Chip variant="outlined" label="Alle varianter" sx={{ borderRadius: 2 }} />}
          </>
        )}
      </Stack>
    </Box>
  );
}
