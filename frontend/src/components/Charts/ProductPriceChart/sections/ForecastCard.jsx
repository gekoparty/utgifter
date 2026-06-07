import React from "react";
import { Card, CardContent, Typography, Divider, Stack, Chip, Box } from "@mui/material";
import dayjs from "dayjs";
import { formatCurrency, fmtPct } from "../utils/format";

const DetailRow = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.6 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={800} sx={{ textAlign: "right" }}>
      {value}
    </Typography>
  </Box>
);

export default function ForecastCard({ freq, discount, top }) {
  return (
    <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
          Prognose og rabatter
        </Typography>

        <Box sx={{ mt: 1.5 }}>
          <DetailRow
            label="Sist kjøpt"
            value={freq.lastPurchaseDate ? dayjs(freq.lastPurchaseDate).format("DD. MMM YYYY") : "—"}
          />
          <DetailRow
            label="Median intervall"
            value={Number.isFinite(freq.medianGapDays) ? `${Math.round(freq.medianGapDays)} dager` : "—"}
          />
          <DetailRow
            label="Neste kjøp"
            value={freq.nextPurchaseDate ? dayjs(freq.nextPurchaseDate).format("DD. MMM YYYY") : "—"}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <DetailRow label="Rabattkjøp" value={discount.discountedPurchases ?? 0} />
          <DetailRow label="Spart totalt" value={formatCurrency(discount.totalSavings ?? 0)} />
          <DetailRow label="Sparerate" value={fmtPct(discount.savingsRate)} />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
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
