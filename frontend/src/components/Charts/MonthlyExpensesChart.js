import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveBar } from '@nivo/bar';
import { Paper, Typography, useTheme } from '@mui/material';
import dayjs from 'dayjs';

export default function MonthlyExpensesChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats', 'expensesByMonth'],
    queryFn: () =>
      fetch('/api/stats/expenses-by-month').then(r => r.json()),
  });

  const theme = useTheme();

  if (isLoading) return <Typography>Loading…</Typography>;
  if (error) return <Typography color="error">Error loading stats</Typography>;

  const chartData = data.map(item => ({
    month: dayjs(item.month + '-01').format('MMM YYYY'),
    total: item.total,
  }));

  return (
    <Paper sx={{ p: 3, mb: 4, height: 400 }}>
      <Typography variant="h5" gutterBottom>Monthly Expenses</Typography>
      <ResponsiveBar
        data={chartData}
        keys={['total']}
        indexBy="month"
        margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={{ scheme: 'nivo' }}
        enableLabel={false}
        axisBottom={{
          tickRotation: -45,
          tickSize: 5,
          tickPadding: 5,
        }}
        axisLeft={{
          format: value => new Intl.NumberFormat().format(value),
          tickSize: 5,
          tickPadding: 5,
        }}
        tooltip={({ id, value, indexValue }) => (
          <strong>
            {indexValue}: {new Intl.NumberFormat().format(value)}
          </strong>
        )}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: theme.palette.text.primary,
              },
            },
            legend: {
              text: {
                fill: theme.palette.text.secondary,
              },
            },
          },
          tooltip: {
            container: {
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
              fontSize: 12,
            },
          },
        }}
      />
    </Paper>
  );
}