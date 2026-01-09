import React from "react";
import { Card, CardContent, Typography, Box, Divider, Stack, Chip } from "@mui/material";
import { formatCurrency } from "../utils/format";

export default function MonthlySpendCard({ monthlySpend, top }) {
  return (
    <Card elevation={3} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          Total spend per måned
        </Typography>

        <Box sx={{ mt: 1 }}>
          {monthlySpend.slice(-12).map((m) => (
            <Box
              key={m.month}
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.75 }}
            >
              <Typography variant="body2">{m.month}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatCurrency(m.totalSpend)}
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

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
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
