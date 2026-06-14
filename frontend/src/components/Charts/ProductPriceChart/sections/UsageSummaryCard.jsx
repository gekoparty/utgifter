import React from "react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { formatCurrency } from "../utils/format";

const TopLine = ({ icon, label, item, value }) => (
  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ minWidth: 0 }}>
    <Box sx={{ color: "primary.main", display: "grid", placeItems: "center", mt: 0.15 }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={900} noWrap>
        {item?.name || "Ingen data"}
      </Typography>
      {item?.purchases != null || value != null ? (
        <Typography variant="caption" color="text.secondary">
          {item?.purchases != null ? `${item.purchases} kjøp` : ""}
          {item?.purchases != null && value != null ? " · " : ""}
          {value != null ? formatCurrency(value) : ""}
        </Typography>
      ) : null}
    </Box>
  </Stack>
);

export default function UsageSummaryCard({ usage }) {
  const top = usage?.top ?? {};
  const category = usage?.category || "Ikke kategorisert";

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Bruk og plassering
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              Hvor dette produktet dukker opp i utgiftene.
            </Typography>
          </Box>
          <Chip
            size="small"
            icon={<CategoryOutlinedIcon />}
            label={category}
            color={usage?.category ? "primary" : "default"}
            variant={usage?.category ? "filled" : "outlined"}
            sx={{ flexShrink: 0, fontWeight: 850 }}
          />
        </Stack>

        <Box sx={{ display: "grid", gap: 1.1, mt: 1.5 }}>
          <TopLine
            icon={<StorefrontIcon fontSize="small" />}
            label="Mest brukt butikk"
            item={top.shopMostOften}
          />
          <TopLine
            icon={<LocalOfferOutlinedIcon fontSize="small" />}
            label="Mest brukt merke"
            item={top.brandMostOften}
          />
          <TopLine
            icon={<PlaceOutlinedIcon fontSize="small" />}
            label="Mest brukt sted"
            item={top.locationMostOften}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
