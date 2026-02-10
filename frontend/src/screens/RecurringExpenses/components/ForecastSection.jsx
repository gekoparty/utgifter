import React, { memo, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Slider,
} from "@mui/material";
import { CalendarMonth } from "@mui/icons-material";
import dayjs from "dayjs";

import ForecastMonthCard from "./ForecastMonthCard";
import ForecastRangeChart from "./ForecastRangeChart";

function ForecastSection({
  title = "Tidslinje",
  forecast,
  tab,
  onTab,
  onOpenMonth,
  maxRef,
  formatCurrency,

  // ✅ NEW
  pastMonths,
  setPastMonths,
  monthsForward = 12,
  meta,
}) {
  const [view, setView] = useState("chart"); // "chart" | "cards"
  const cardsMaxRef = useMemo(() => maxRef, [maxRef]);

  const hasData = Array.isArray(forecast) && forecast.length > 0;

  const thisMonthKey = useMemo(() => dayjs().format("YYYY-MM"), []);
  const rangeLabel = useMemo(() => {
    if (!hasData) return "";
    const first = forecast[0]?.key;
    const last = forecast[forecast.length - 1]?.key;
    return first && last ? `${first} → ${last}` : "";
  }, [hasData, forecast]);

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
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={950} noWrap sx={{ minWidth: 0 }}>
                {title}
              </Typography>
              {rangeLabel && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {rangeLabel} (nå: {thisMonthKey})
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <ToggleButtonGroup
              size="small"
              value={view}
              exclusive
              onChange={(_, v) => v && setView(v)}
              sx={{ "& .MuiToggleButton-root": { fontWeight: 800, px: 1.25 } }}
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

        {/* ✅ History Slider */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ minWidth: 70 }}>
            Historikk
          </Typography>
          <Slider
            size="small"
            min={0}
            max={24}
            step={3}
            value={pastMonths}
            onChange={(_, v) => setPastMonths(v)}
            valueLabelDisplay="auto"
          />
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 90, textAlign: "right" }}>
            +{monthsForward} mnd frem
          </Typography>
        </Stack>

        {!hasData && (
          <Typography variant="body2" color="text.secondary">
            Ingen data i valgt periode.
          </Typography>
        )}

        {hasData && (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(ForecastSection);
