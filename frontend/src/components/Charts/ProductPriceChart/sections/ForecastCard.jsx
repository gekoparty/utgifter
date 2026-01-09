import React from "react";
import { Card, CardContent, Typography, Divider, Stack, Chip } from "@mui/material";
import dayjs from "dayjs";
import { formatCurrency, fmtPct } from "../utils/format";

export default function ForecastCard({ freq, discount, top }) {
  return (
    <Card elevation={3} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          Prognose & rabatter
        </Typography>

        <Typography variant="body2" sx={{ mt: 1 }}>
          <strong>Sist kjøpt:</strong> {freq.lastPurchaseDate ? dayjs(freq.lastPurchaseDate).format("DD. MMM YYYY") : "—"}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Median intervall:</strong> {Number.isFinite(freq.medianGapDays) ? `${Math.round(freq.medianGapDays)} dager` : "—"}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Neste kjøp (est.):</strong> {freq.nextPurchaseDate ? dayjs(freq.nextPurchaseDate).format("DD. MMM YYYY") : "—"}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2">
          <strong>Rabattkjøp:</strong> {discount.discountedPurchases ?? 0}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Spart totalt:</strong> {formatCurrency(discount.totalSavings ?? 0)}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Sparerate:</strong> {fmtPct(discount.savingsRate)}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          {top.brandMostOften && <Chip label={`Vanligste merke: ${top.brandMostOften.name} (${top.brandMostOften.purchases})`} />}
          {top.brandCheapestAvg && (
            <Chip
              variant="outlined"
              label={`Billigst merke: ${top.brandCheapestAvg.name} (${top.brandCheapestAvg.avgPricePerUnit.toFixed(2)} kr/enhet)`}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
