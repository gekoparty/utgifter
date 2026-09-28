import React from "react";
import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import CompareArrowsRoundedIcon from "@mui/icons-material/CompareArrowsRounded";
import SectionCard from "../../../commons/Layout/SectionCard";
import { currencyFormatter, pct } from "../utils/format";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "";

const toneForDiff = (value) => (Number(value || 0) > 0 ? "warning.main" : "success.main");

export default function SameDateComparisonCard({ comparison }) {
  if (!comparison) return null;

  const rows = (comparison.categories ?? []).slice(0, 6);
  const maxAbs = Math.max(...rows.map((row) => Math.abs(Number(row.diff || 0))), 1);
  const diff = Number(comparison.diff || 0);
  const isHigher = diff > 0;

  return (
    <SectionCard
      title="Hittil i år mot samme dato i fjor"
      subtitle={`${formatDate(comparison.currentStart)} - ${formatDate(comparison.currentEnd)} sammenlignet med ${formatDate(comparison.previousStart)} - ${formatDate(comparison.previousEnd)}`}
      icon={<CompareArrowsRoundedIcon fontSize="small" />}
    >
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 0.35fr) minmax(0, 0.65fr)" },
          alignItems: "start",
        }}
      >
        <Box
          sx={(theme) => ({
            p: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.10)",
            bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.025)" : "rgba(248,250,252,0.9)",
          })}
        >
          <Typography variant="caption" color="text.secondary">
            Totalt til nå
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 950, color: toneForDiff(diff), mt: 0.25 }}>
            {diff >= 0 ? "+" : ""}
            {currencyFormatter(diff)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {currencyFormatter(comparison.currentSum)} i {comparison.currentYear} mot{" "}
            {currencyFormatter(comparison.previousSum)} i {comparison.previousYear}.
          </Typography>
          <Chip
            size="small"
            label={`${pct(comparison.pct)} ${isHigher ? "høyere" : "lavere"}`}
            color={isHigher ? "warning" : "success"}
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </Box>

        <Stack spacing={1}>
          {rows.length ? (
            rows.map((row) => {
              const rowDiff = Number(row.diff || 0);
              const value = Math.min((Math.abs(rowDiff) / maxAbs) * 100, 100);
              return (
                <Box key={row.name}>
                  <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 850 }} noWrap>
                        {row.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currencyFormatter(row.current)} mot {currencyFormatter(row.previous)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 950, color: toneForDiff(rowDiff), whiteSpace: "nowrap" }}
                    >
                      {rowDiff >= 0 ? "+" : ""}
                      {currencyFormatter(rowDiff)}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={value}
                    color={rowDiff > 0 ? "warning" : "success"}
                    sx={{ mt: 0.75, height: 5, borderRadius: 999 }}
                  />
                </Box>
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary">
              Ingen kategorier å sammenligne i denne perioden.
            </Typography>
          )}
        </Stack>
      </Box>
    </SectionCard>
  );
}
