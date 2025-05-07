// src/components/MonthlyExpensesChart.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Paper, Typography } from '@mui/material';
import dayjs from 'dayjs';

export default function MonthlyExpensesChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['stats', 'expensesByMonth'],
    queryFn: () =>
      fetch('/api/stats/expenses-by-month').then(r => r.json()),
  });

  if (isLoading) return <Typography>Loading…</Typography>;
  if (error) return <Typography color="error">Error loading stats</Typography>;

  const chartData = data.map(item => ({
    name: dayjs(item.month + '-01').format('MMM YYYY'),
    total: item.total,
  }));

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>Monthly Expenses</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={v => new Intl.NumberFormat().format(v)} />
          <Bar dataKey="total" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}