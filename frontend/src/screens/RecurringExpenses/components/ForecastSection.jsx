import React, { memo, useMemo, useState } from "react";
import { Box, Card, CardContent, Stack, Tabs, Tab, Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { CalendarMonth } from "@mui/icons-material";

import ForecastMonthCard from "./ForecastMonthCard";
import ForecastRangeChart from "./ForecastRangeChart";

function ForecastSection({
  forecast,
  tab,
  onTab,
  onOpenMonth,
  maxRef,
  formatCurrency,
}) {
  const [view, setView] = useState("chart"); // "chart" | "cards"

  const cardsMaxRef = useMemo(() => maxRef, [maxRef]);

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
          sx={{ mb: 1.25 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <CalendarMonth />
            <Typography variant="h6" fontWeight={950} noWrap sx={{ minWidth: 0 }}>
              Kommende måneder
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <ToggleButtonGroup
              size="small"
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
              sx={{
                "& .MuiToggleButton-root": { fontWeight: 800, px: 1.25 },
              }}
            >
              <ToggleButton value="chart">Chart</ToggleButton>
              <ToggleButton value="cards">Cards</ToggleButton>
            </ToggleButtonGroup>

            <Tabs value={tab} onChange={(_, v) => onTab(v)} sx={{ minHeight: 36 }}>
              <Tab label="Forventet" sx={{ minHeight: 36 }} />
              <Tab label="Betalt" sx={{ minHeight: 36 }} />
            </Tabs>
          </Stack>
        </Stack>

        {/* Body */}
        {view === "chart" ? (
          <ForecastRangeChart
            forecast={forecast}
            tab={tab}
            onOpenMonth={onOpenMonth}
            formatCurrency={formatCurrency}
          />
        ) : (
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
                maxRef={cardsMaxRef}
                onOpenMonth={onOpenMonth}
                formatCurrency={formatCurrency}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(ForecastSection);
