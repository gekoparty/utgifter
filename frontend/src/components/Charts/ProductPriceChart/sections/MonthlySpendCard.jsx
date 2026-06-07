import React from "react";
import { Card, CardContent, Typography, Box, Divider, Stack, Chip } from "@mui/material";
import { formatCurrency } from "../utils/format";

export default function MonthlySpendCard({ monthlySpend, top }) {
  return (
    <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
          Forbruk per måned
        </Typography>

        <Box sx={{ mt: 1.5, display: "grid", gap: 0.75 }}>
          {monthlySpend.slice(-12).map((month) => (
            <Box
              key={month.month}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                py: 0.75,
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {month.month}
              </Typography>
              <Typography variant="body2" fontWeight={800}>
                {formatCurrency(month.totalSpend)}
              </Typography>
            </Box>
          ))}
          {!monthlySpend.length && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Ingen månedlige data tilgjengelig.
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          {top.shopMostOften && <Chip label={`Mest kjøpt: ${top.shopMostOften.name} (${top.shopMostOften.purchases})`} />}
          {top.shopCheapestAvg && (
            <Chip
              variant="outlined"
              label={`Billigst snitt: ${top.shopCheapestAvg.name} (${top.shopCheapestAvg.avgPricePerUnit.toFixed(2)} kr/enhet)`}
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
