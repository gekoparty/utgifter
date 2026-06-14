import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { formatCurrency } from "../utils/format";

const monthLabel = (monthKey) => {
  const [year, month] = String(monthKey || "").split("-").map(Number);
  if (!year || !month) return monthKey || "Ukjent";
  return new Date(year, month - 1, 1).toLocaleDateString("nb-NO", {
    month: "short",
    year: "numeric",
  });
};

export default function MonthlySpendCard({ monthlySpend }) {
  const allRows = useMemo(() => {
    return Array.isArray(monthlySpend) ? monthlySpend : [];
  }, [monthlySpend]);

  const latestRows = useMemo(() => allRows.slice(-2).reverse(), [allRows]);

  const totalPurchases = allRows.reduce((sum, row) => sum + Number(row.purchases || 0), 0);
  const totalSpend = allRows.reduce((sum, row) => sum + Number(row.totalSpend || 0), 0);
  const avgSpendPerActiveMonth = allRows.length ? totalSpend / allRows.length : 0;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Kjøpsmåneder
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Siste {latestRows.length} av {allRows.length} måneder med kjøp.
            </Typography>
          </Box>

          <Chip
            size="small"
            variant="outlined"
            label={`${allRows.length} totalt`}
            sx={{ flexShrink: 0, fontWeight: 800 }}
          />
        </Stack>

        {allRows.length ? (
          <Stack spacing={1}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 1,
                p: 1,
                borderRadius: 1.5,
                bgcolor: "action.selected",
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Alle kjøp
                </Typography>
                <Typography fontWeight={950} noWrap>{totalPurchases}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Snitt/mnd
                </Typography>
                <Typography fontWeight={950} noWrap>{formatCurrency(avgSpendPerActiveMonth)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Totalt brukt
                </Typography>
                <Typography fontWeight={950} noWrap>{formatCurrency(totalSpend)}</Typography>
              </Box>
            </Box>

            {latestRows.map((month) => {
              const spend = Number(month.totalSpend || 0);

              return (
                <Box
                  key={month.month}
                  sx={{
                    px: 1,
                    py: 0.75,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="center">
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={900}>
                        {monthLabel(month.month)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Number(month.purchases || 0)} kjøp
                        {Number.isFinite(Number(month.avgPricePerUnit))
                          ? ` · snitt ${formatCurrency(month.avgPricePerUnit)}`
                          : ""}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={950} sx={{ whiteSpace: "nowrap" }}>
                      {formatCurrency(spend)}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Ingen kjøpsmåneder for dette produktet ennå.
          </Typography>
        )}

      </CardContent>
    </Card>
  );
}
