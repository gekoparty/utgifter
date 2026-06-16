import React, { memo, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  Typography,
  Slider,
} from "@mui/material";
import { CalendarMonth } from "@mui/icons-material";
import dayjs from "dayjs";

import SegmentedControl from "../../../components/commons/Controls/SegmentedControl";
import ForecastMonthCard from "./ForecastMonthCard";
import ForecastRangeChart from "./ForecastRangeChart";

const viewOptions = [
  { value: "chart", label: "Graf" },
  { value: "cards", label: "Kort" },
];

function ForecastSection({
  title = "Tidslinje",
  forecast,
  tab,
  onTab,
  onOpenMonth,
  maxRef,
  formatCurrency,
  pastMonths,
  setPastMonths,
  monthsForward = 12,
}) {
  const [view, setView] = useState("chart");
  const cardsMaxRef = useMemo(() => maxRef, [maxRef]);
  const hasData = Array.isArray(forecast) && forecast.length > 0;
  const showRangeControl =
    Number.isFinite(Number(pastMonths)) && typeof setPastMonths === "function";

  const thisMonthKey = useMemo(() => dayjs().format("YYYY-MM"), []);
  const rangeLabel = useMemo(() => {
    if (!hasData) return "";
    const first = forecast[0]?.key;
    const last = forecast[forecast.length - 1]?.key;
    return first && last ? `${first} - ${last}` : "";
  }, [hasData, forecast]);

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1.25}
          sx={{ mb: 1.5 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <CalendarMonth />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={950} noWrap sx={{ minWidth: 0 }}>
                {title}
              </Typography>
              {rangeLabel ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {rangeLabel} (nå: {thisMonthKey})
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <SegmentedControl
              value={view}
              onChange={setView}
              options={viewOptions}
              ariaLabel="Velg tidslinjevisning"
            />

            <Tabs value={tab} onChange={(_, value) => onTab(value)} sx={{ minHeight: 36 }}>
              <Tab label="Forventet" sx={{ minHeight: 36 }} />
              <Tab label="Betalt" sx={{ minHeight: 36 }} />
            </Tabs>
          </Stack>
        </Stack>

        {showRangeControl ? (
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
              onChange={(_, value) => setPastMonths(value)}
              valueLabelDisplay="auto"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ minWidth: 90, textAlign: "right" }}
            >
              +{monthsForward} mnd frem
            </Typography>
          </Stack>
        ) : null}

        {!hasData ? (
          <Typography variant="body2" color="text.secondary">
            Ingen data i valgt periode.
          </Typography>
        ) : null}

        {hasData ? (
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
                    xl: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                {forecast.map((month) => (
                  <ForecastMonthCard
                    key={month.key}
                    month={month}
                    tab={tab}
                    maxRef={cardsMaxRef}
                    onOpenMonth={onOpenMonth}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </Box>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default memo(ForecastSection);
