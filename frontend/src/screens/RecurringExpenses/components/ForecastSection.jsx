import React, { memo } from "react";
import { Box, Card, CardContent, Stack, Tabs, Tab, Typography } from "@mui/material";
import { CalendarMonth } from "@mui/icons-material";
import ForecastMonthCard from "./ForecastMonthCard";

function ForecastSection({
  forecast,
  tab,
  onTab,
  onOpenMonth,
  maxRef,
  formatCurrency,
}) {
  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
          sx={{ mb: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <CalendarMonth />
            <Typography variant="h6" fontWeight={900} noWrap sx={{ minWidth: 0 }}>
              Kommende måneder
            </Typography>
          </Stack>

          <Tabs value={tab} onChange={(_, v) => onTab(v)}>
            <Tab label="Forventet" />
            <Tab label="Betalt" />
          </Tabs>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {forecast.map((m) => (
            <ForecastMonthCard
              key={m.key}
              month={m}
              tab={tab}
              maxRef={maxRef}
              onOpenMonth={onOpenMonth}
              formatCurrency={formatCurrency}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default memo(ForecastSection);