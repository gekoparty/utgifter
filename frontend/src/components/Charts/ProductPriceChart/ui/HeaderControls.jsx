import React, { useMemo } from "react";
import {
  Autocomplete,
  Box,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import SegmentedControl from "../../../commons/Controls/SegmentedControl";

const modeOptions = [
  { value: "overview", label: "Oversikt" },
  { value: "shops", label: "Butikker" },
  { value: "distribution", label: "Fordeling" },
  { value: "yearly", label: "År" },
];

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
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
          sx={{ mt: 0.4 }}
        >
          <Typography variant="body2" color="text.secondary">
            Prisutvikling og butikkhistorikk
          </Typography>
          {productCategory ? (
            <Chip
              size="small"
              variant="outlined"
              label={productCategory}
              sx={{ height: 24 }}
            />
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
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={modeOptions}
          ariaLabel="Velg produktstatistikk"
          sx={{ flexWrap: "wrap" }}
          buttonSx={{ textTransform: "none", fontWeight: 700 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={includeDiscounts}
              onChange={(event) => setIncludeDiscounts(event.target.checked)}
            />
          }
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

        {showVariantSelector ? (
          <>
            <Autocomplete
              multiple
              size="small"
              disablePortal
              options={variants}
              getOptionLabel={(option) => option?.name ?? ""}
              value={selectedVariantObjects}
              onChange={(_, selected) =>
                setSelectedVariantIds(selected.map((variant) => variant.id))
              }
              renderInput={(params) => <TextField {...params} label="Varianter" />}
              sx={{ width: { xs: "100%", sm: 320 } }}
            />
            {!selectedVariantIds?.length ? (
              <Chip
                variant="outlined"
                label="Alle varianter"
                sx={{ borderRadius: 2 }}
              />
            ) : null}
          </>
        ) : null}
      </Stack>
    </Box>
  );
}
