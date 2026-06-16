import React from "react";
import { Box, Stack, Typography } from "@mui/material";

const defaultFormatter = (value) => String(value ?? "");

export default function BreakdownList({
  title,
  icon,
  rows = [],
  total = 0,
  maxRows = 4,
  formatValue = defaultFormatter,
  emptyText = "Ingen data å vise",
}) {
  const visibleRows = rows.slice(0, maxRows);
  const maxValue = Math.max(...visibleRows.map((row) => Number(row.value || 0)), 1);

  const header = title ? (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.9 }}>
      {icon ? (
        <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>
          {icon}
        </Box>
      ) : null}
      <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
        {title}
      </Typography>
    </Stack>
  ) : null;

  if (!visibleRows.length) {
    return (
      <Box sx={{ minWidth: 0 }}>
        {header}
        <Typography variant="body2" color="text.secondary">
          {emptyText}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      {header}
      <Stack spacing={0.7}>
        {visibleRows.map((row) => {
          const value = Number(row.value || 0);
          const pct = total > 0 ? (value / total) * 100 : 0;

          return (
            <Box key={`${row.name}-${value}`}>
              <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                <Typography variant="body2" fontWeight={800} noWrap>
                  {row.name}
                </Typography>
                <Typography variant="body2" fontWeight={900} sx={{ whiteSpace: "nowrap" }}>
                  {formatValue(value)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                <Typography variant="caption" color="text.secondary">
                  {row.count ?? 0} kjøp
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {pct.toFixed(0)}%
                </Typography>
              </Stack>
              <Box
                sx={{
                  mt: 0.35,
                  height: 5,
                  borderRadius: 999,
                  bgcolor: "action.selected",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    width: `${Math.max(4, (value / maxValue) * 100)}%`,
                    height: "100%",
                    borderRadius: "inherit",
                    bgcolor: "primary.main",
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
