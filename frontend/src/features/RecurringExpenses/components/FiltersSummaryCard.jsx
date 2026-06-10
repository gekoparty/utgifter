import React, { memo } from "react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { RECURRING_TYPES } from "../utils/recurringTypes";

function FiltersSummaryCard({ filter, onFilter, sum3, formatCurrency }) {
  return (
    <Card sx={{ mt: 1 }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={900}>
              Vis
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
          </Box>

          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.04)",
              border: "1px solid",
              borderColor: "divider",
              minWidth: { md: 280 },
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Forventet neste 3 måneder
            </Typography>
            <Typography variant="h6" fontWeight={900}>
              {formatCurrency(sum3.min)} - {formatCurrency(sum3.max)}
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Betalt siste/valgte periode: <strong>{formatCurrency(sum3.paid ?? 0)}</strong>
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default memo(FiltersSummaryCard);
