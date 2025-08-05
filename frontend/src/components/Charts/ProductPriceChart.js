import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveLine } from "@nivo/line";
import { Paper, Typography } from "@mui/material";
import dayjs from "dayjs";
import _ from "lodash";

export default function ProductPriceChart({ productId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats", "priceHistory", productId],
    queryFn: () =>
      fetch(`/api/stats/price-per-unit-history?productId=${productId}`).then(
        (r) => {
          if (!r.ok) throw new Error("Network response was not ok");
          return r.json();
        }
      ),
    enabled: !!productId,
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

  const productNameStr = data.length > 0 ? data[0].productName.name : "Product";
  const measurementUnit = data[0]?.productName?.measurementUnit || "unit";

  // ✅ Convert to Nivo-friendly format:
  // Group by shop name
  const groupedByShop = _.groupBy(data, "shopName");

  // Map each shop into a Nivo-compatible series
  const nivoData = Object.entries(groupedByShop).map(([shopName, records]) => ({
    id: shopName,
    data: records
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((d) => ({
        x: dayjs(d.date).format("YYYY-MM-DD"),
        y: d.pricePerUnit,
      })),
  }));

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        {productNameStr} — Pris Historie per Butikk
      </Typography>
      <div style={{ height: 400 }}>
        <ResponsiveLine
          data={nivoData}
          xScale={{ type: "time", format: "%Y-%m-%d", precision: "day" }}
          yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
          margin={{ top: 40, right: 100, bottom: 80, left: 60 }}
          axisBottom={{
            format: "%b %d",
            tickValues: "every month",
            tickRotation: -30,
            legend: "Dato",
            legendOffset: 50,
            legendPosition: "middle",
          }}
          axisLeft={{
            orient: "left",
            legend: `Pris per ${measurementUnit}`,
            legendOffset: -50,
            legendPosition: "middle",
          }}
          useMesh={true}
          enableSlices="x"
          colors={{ scheme: "category10" }}
          pointSize={4}
          pointBorderWidth={1}
          pointLabelYOffset={-12}
          legends={[
            {
              anchor: "top-left",
              direction: "column",
              justify: false,
              translateX: 0,
              translateY: -30,
              itemsSpacing: 4,
              itemWidth: 100,
              itemHeight: 20,
              symbolSize: 12,
              symbolShape: "circle",
            },
          ]}
          tooltip={({ point }) => (
            <div
              style={{
                background: "white",
                padding: "6px 9px",
                border: "1px solid #ccc",
              }}
            >
              <strong>{point.serieId}</strong>
              <br />
              Dato: {dayjs(point.data.x).format("DD. MMM YYYY")}
              <br />
              Pris: {point.data.yFormatted} per {measurementUnit}
            </div>
          )}
        />
      </div>
    </Paper>
  );
}
