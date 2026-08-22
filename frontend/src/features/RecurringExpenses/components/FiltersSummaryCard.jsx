import React, { memo } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { RECURRING_TYPES } from "../utils/recurringTypes";

function FiltersSummaryCard({ filter, onFilter }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.25, sm: 1.5 }, borderRadius: 2, boxShadow: "none" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={950}>
              Filter
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Velg hvilke faste kostnader som skal vises.
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Chip
                size="small"
                label="Alle"
                variant={filter === "ALL" ? "filled" : "outlined"}
                onClick={() => onFilter("ALL")}
                sx={{ fontWeight: 800 }}
              />

              {RECURRING_TYPES.map((t) => (
                <Chip
                  key={t.key}
                  size="small"
                  label={t.label}
                  color={filter === t.key ? t.color : undefined}
                  variant={filter === t.key ? "filled" : "outlined"}
                  onClick={() => onFilter(t.key)}
                  sx={{ fontWeight: 850 }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
    </Paper>
  );
}

export default memo(FiltersSummaryCard);
