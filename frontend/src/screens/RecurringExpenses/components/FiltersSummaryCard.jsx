import React, { memo } from "react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { RECURRING_TYPES } from "../utils/recurringTypes";

function FiltersSummaryCard({ filter, onFilter, sum3, formatCurrency }) {
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="Alle"
              variant={filter === "ALL" ? "filled" : "outlined"}
              onClick={() => onFilter("ALL")}
              sx={{ fontWeight: 800 }}
            />

            {RECURRING_TYPES.map((t) => (
              <Chip
                key={t.key}
                label={t.label}
                color={filter === t.key ? t.color : undefined}
                variant={filter === t.key ? "filled" : "outlined"}
                onClick={() => onFilter(t.key)}
                sx={{ fontWeight: 800 }}
              />
            ))}
          </Stack>

          <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
            <Typography variant="caption" color="text.secondary">
              Neste 3 måneder (forventet)
            </Typography>
            <Typography variant="h6" fontWeight={900}>
              {formatCurrency(sum3.min)} – {formatCurrency(sum3.max)}
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Betalt (3 mnd): <strong>{formatCurrency(sum3.paid ?? 0)}</strong>
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default memo(FiltersSummaryCard);