import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import dayjs from "dayjs";
import { formatCurrency, fmtPct } from "../utils/format";

const DetailItem = ({ label, value }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={850} noWrap>
      {value}
    </Typography>
  </Box>
);

export default function ForecastCard({ freq, discount }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
          Prognose og rabatter
        </Typography>

        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1,
          }}
        >
          <DetailItem
            label="Sist kjøpt"
            value={freq.lastPurchaseDate ? dayjs(freq.lastPurchaseDate).format("DD. MMM YYYY") : "—"}
          />
          <DetailItem
            label="Median intervall"
            value={Number.isFinite(freq.medianGapDays) ? `${Math.round(freq.medianGapDays)} dager` : "—"}
          />
          <DetailItem
            label="Neste kjøp"
            value={freq.nextPurchaseDate ? dayjs(freq.nextPurchaseDate).format("DD. MMM YYYY") : "—"}
          />
          <DetailItem label="Rabattkjøp" value={discount.discountedPurchases ?? 0} />
          <DetailItem label="Spart totalt" value={formatCurrency(discount.totalSavings ?? 0)} />
          <DetailItem label="Sparerate" value={fmtPct(discount.savingsRate)} />
        </Box>
      </CardContent>
    </Card>
  );
}
