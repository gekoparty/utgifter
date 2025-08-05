import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Paper, Typography } from "@mui/material";
import dayjs from "dayjs";

export default function ProductPriceChart({ productId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats", "priceHistory", productId],
    queryFn: () =>
      fetch(`/api/stats/price-per-unit-history?productId=${productId}`).then((r) => {
        if (!r.ok) throw new Error("Network response was not ok");
        return r.json();
      }),
    enabled: !!productId, // only fetch once a product is selected
  });

  if (!productId) {
    return (
      <Typography>Select a product above to see its price history</Typography>
    );
  }
  if (isLoading) {
    return <Typography>Loading price history…</Typography>;
  }
  if (error) {
    return <Typography color="error">Error loading price history</Typography>;
  }

  // Pull the product name from the first data point (they're all the same)
 const productNameStr = data.length > 0 ? data[0].productName.name : "Product";

const chartData = data.map(point => ({
  date: dayjs(point.date).format('MMM D, YYYY'),
  pricePerUnit: point.pricePerUnit,
}));

return (
  <Paper sx={{ p: 3, mb: 4 }}>
    <Typography variant="h5" gutterBottom>
      {productNameStr} — Pris Historie
    </Typography>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} />
        <YAxis />
        <Tooltip
          labelFormatter={(label) => `Date: ${label}`}
          formatter={(value) => [
            `${value.toFixed(2)} per ${data[0]?.productName?.measurementUnit || "unit"}`,
            "Price/Unit",
          ]}
        />
        <Line
          dataKey="pricePerUnit"
          name="Pris pr unit"
          stroke="#8884d8"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </Paper>
);
}
