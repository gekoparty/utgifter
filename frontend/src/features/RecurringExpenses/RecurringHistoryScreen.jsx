import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useRecurringHistory } from "./hooks/useRecurringHistory";
import RecurringHistoryCharts from "./components/RecurringHistoryCharts";

export default function RecurringHistoryScreen() {
  const to = dayjs().format("YYYY-MM");
  const from = dayjs().subtract(12, "month").format("YYYY-MM");

  const { data, isLoading } = useRecurringHistory({ from, to });

  if (isLoading) return <Typography>Laster historikk…</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={900} sx={{ mb: 2 }}>
        Historikk siste 12 måneder
      </Typography>

      <RecurringHistoryCharts data={data} />
    </Box>
  );
}
