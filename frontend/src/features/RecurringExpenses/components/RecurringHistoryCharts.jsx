import React, { memo, useMemo } from "react";
import { Card, CardContent, Typography } from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

function RecurringHistoryCharts({ data }) {
  const monthData = useMemo(() => {
    if (!data?.totals?.byMonth) return [];
    return Object.entries(data.totals.byMonth).map(([k, v]) => ({ month: k, amount: v }));
  }, [data]);

  const typeData = useMemo(() => {
    if (!data?.totals?.byType) return [];
    return Object.entries(data.totals.byType).map(([k, v]) => ({ name: k, value: v }));
  }, [data]);

  if (!data) return null;

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={900}>Betalinger per måned</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={900}>Fordeling per kategori</Typography>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={typeData} dataKey="value" nameKey="name" outerRadius={90}>
                {typeData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

export default memo(RecurringHistoryCharts);