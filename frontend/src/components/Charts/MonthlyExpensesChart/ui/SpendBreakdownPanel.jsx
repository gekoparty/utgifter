import React, { useMemo, useState } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import SegmentedControl from "../../../commons/Controls/SegmentedControl";
import BreakdownList from "../../../commons/DataDisplay/BreakdownList";
import SectionCard from "../../../commons/Layout/SectionCard";
import { currencyFormatter } from "../utils/format";

const TYPE_CONFIG = {
  categories: { label: "Kategori", title: "Kategori", icon: <CategoryRoundedIcon fontSize="small" /> },
  shops: { label: "Butikk", title: "Butikk", icon: <StorefrontRoundedIcon fontSize="small" /> },
  brands: { label: "Merke", title: "Merke", icon: <SellRoundedIcon fontSize="small" /> },
  locations: { label: "Sted", title: "Sted", icon: <PlaceRoundedIcon fontSize="small" /> },
};

const SCOPE_OPTIONS = [
  { value: "month", label: "Måned" },
  { value: "year", label: "År" },
  { value: "all", label: "Alt" },
];

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

const scopeText = (scope, year, month) => {
  if (scope === "all") return "Alle registrerte utgifter";
  if (scope === "month") return month ? `Siste aktive måned i ${year}` : `Måned i ${year}`;
  return `Hele ${year}`;
};

export default function SpendBreakdownPanel({
  breakdowns = {},
  scope,
  onScopeChange,
  year,
  month,
}) {
  const [type, setType] = useState("categories");
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.categories;
  const rows = breakdowns?.[type]?.[scope] ?? [];
  const total = useMemo(
    () => rows.reduce((sum, row) => sum + Number(row?.value || 0), 0),
    [rows],
  );

  return (
    <SectionCard
      title="Hvor brukes pengene"
      subtitle={scopeText(scope, year, month)}
      icon={config.icon}
      action={
        <Typography variant="subtitle2" fontWeight={950} sx={{ whiteSpace: "nowrap" }}>
          {currencyFormatter(total)}
        </Typography>
      }
      contentSx={{ height: "100%" }}
    >
      <Stack spacing={1.25}>
        <SegmentedControl
          value={type}
          onChange={setType}
          options={TYPE_OPTIONS}
          ariaLabel="Fordelingstype"
          fullWidth
          sx={{
            "& .MuiToggleButton-root": {
              px: 0.75,
              py: 0.35,
              fontSize: 12,
            },
          }}
        />

        <SegmentedControl
          value={scope}
          onChange={onScopeChange}
          options={SCOPE_OPTIONS}
          ariaLabel="Fordelingsperiode"
          fullWidth
          sx={{
            "& .MuiToggleButton-root": {
              px: 0.75,
              py: 0.25,
              fontSize: 12,
            },
          }}
        />

        <Divider />

        <BreakdownList
          title={config.title}
          rows={rows}
          total={total}
          maxRows={7}
          formatValue={currencyFormatter}
          emptyText="Ingen utgifter i denne perioden."
        />

        {rows.length < 3 ? (
          <Box
            sx={{
              p: 1,
              borderRadius: 1.5,
              bgcolor: "action.selected",
              color: "text.secondary",
            }}
          >
            <Typography variant="caption">
              Lite datagrunnlag her ennå. Fordelingen blir mer nyttig når flere kjøp er registrert i samme periode.
            </Typography>
          </Box>
        ) : null}
      </Stack>
    </SectionCard>
  );
}
