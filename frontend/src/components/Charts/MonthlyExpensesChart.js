import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    ResponsiveBar,
} from '@nivo/bar';
import { 
    Paper, 
    Typography, 
    useTheme, 
    Box, 
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
    Switch,
    FormControlLabel,
} from '@mui/material';
import dayjs from 'dayjs';

// Helper for nice currency formatting (Kr = NOK)
const currencyFormatter = (value) =>
  new Intl.NumberFormat('no-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value);

export default function MonthlyExpensesChart() {
    const theme = useTheme();
    
    const [comparePreviousYear, setComparePreviousYear] = useState(true); 

    const { data, isLoading, error } = useQuery({
        queryKey: ['stats', 'expensesByMonth'],
        queryFn: () => fetch('/api/stats/expenses-by-month').then((r) => r.json()),
    });

    const availableYears = useMemo(() => {
        if (!data) return [];
        const years = data.map(item => dayjs(item.month + '-01').year().toString());
        return [...new Set(years)].sort((a, b) => b - a);
    }, [data]);
    
    const [selectedYear, setSelectedYear] = useState(dayjs().year().toString());
    
    useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears, selectedYear]);

    // Data Aggregation and Comparison Logic
    const chartData = useMemo(() => {
        if (!data || !selectedYear) return [];
        
        const currentYear = selectedYear;
        const previousYear = (parseInt(currentYear) - 1).toString();
        
        const dataMap = data.reduce((acc, item) => {
            const date = dayjs(item.month + '-01');
            const key = date.format('YYYY-MM');
            acc[key] = item.total;
            return acc;
        }, {});

        const finalChartData = [];
        const monthsInYear = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));
        
        for (let i = 0; i < 12; i++) {
            const monthDayjs = dayjs().month(i);
            const monthShort = monthDayjs.format('MMM');
            const monthNumber = monthDayjs.format('MM');

            const currentKey = `${currentYear}-${monthNumber}`;
            const previousKey = `${previousYear}-${monthNumber}`;
            
            const currentTotal = dataMap[currentKey] || 0;
            const previousTotal = dataMap[previousKey] || 0;
            
            finalChartData.push({
                month: monthShort, 
                [currentYear]: currentTotal,
                [previousYear]: previousTotal,
                [`${currentYear} fullName`]: monthDayjs.format(`MMMM ${currentYear}`),
                [`${previousYear} fullName`]: monthDayjs.format(`MMMM ${previousYear}`),
            });
        }
        
        return finalChartData;
    }, [data, selectedYear]);
    
    // --- KEY CHANGE HERE ---
    const previousYearKey = (parseInt(selectedYear) - 1).toString();
    const keys = comparePreviousYear && availableYears.includes(previousYearKey)
        ? [previousYearKey, selectedYear] // Previous Year is now listed first
        : [selectedYear]; 

    // Loading/Error states
    if (isLoading) return <Box p={3} sx={{ textAlign: 'center' }}><CircularProgress /><Typography>Laster data for sammenligning...</Typography></Box>;
    if (error) return <Typography color="error" p={3}>Error loading stats</Typography>;
    if (!availableYears.includes(selectedYear)) return <Box p={3}><Typography color="text.secondary">Select a year to view data.</Typography></Box>;

    // Custom Tooltip for comparison view
    const ComparisonTooltip = ({ data, indexValue, id, value, color }) => {
        const year = id;
        const isCurrentYearBar = id === selectedYear; 
        
        let otherYear = null;
        let otherValue = 0;
        
        if (keys.length > 1) {
            otherYear = keys.find(k => k !== id);
            otherValue = data[otherYear] || 0;
        }

        return (
            <Paper 
                sx={{ 
                    p: 1.5, 
                    backgroundColor: 'background.paper',
                    boxShadow: theme.shadows[4],
                    border: `1px solid ${theme.palette.divider}`
                }}
            >
                <Typography variant="caption" color="text.secondary" display="block">
                    {data[`${year} fullName`] || indexValue}
                </Typography>
                {/* Current Bar */}
                <Stack direction="row" spacing={1} mt={0.5}>
                    <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: '50%' }} />
                    <Typography variant="subtitle2" fontWeight="bold" color={isCurrentYearBar ? 'primary.main' : 'text.primary'}>
                        {year}: {currencyFormatter(value)}
                    </Typography>
                </Stack>
                {/* Comparison Bar (if active) */}
                {keys.length > 1 && (
                    <Stack direction="row" spacing={1} mt={0.5} sx={{ opacity: 0.7 }}>
                        <Box sx={{ width: 10, height: 10, bgcolor: isCurrentYearBar ? theme.palette.grey[500] : theme.palette.primary.main, borderRadius: '50%' }} />
                        <Typography variant="body2" fontSize={12}>
                            {otherYear}: {currencyFormatter(otherValue)}
                        </Typography>
                    </Stack>
                )}
            </Paper>
        );
    };

    const maxValue = Math.max(...chartData.flatMap(d => keys.map(k => d[k]))) * 1.2;

    return (
        <Paper 
            elevation={2} 
            sx={{ 
                p: 3, 
                mb: 4, 
                height: 450, 
                borderRadius: 2,
                background: `linear-gradient(to bottom right, ${theme.palette.background.paper}, ${theme.palette.background.default})` 
            }}
        >
            {/* Header, Year Selector, and Comparison Toggle */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography variant="h6" fontWeight="600" color="text.primary">
                        Monthly Expenses
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {comparePreviousYear && keys.length > 1 
                            ? `Comparing ${selectedYear} vs. ${previousYearKey}` 
                            : `Data for the year ${selectedYear}`}
                    </Typography>
                </Box>

                {/* Controls Group: Toggle + Year Selector */}
                <Stack direction="row" spacing={2} alignItems="center">
                    {/* Comparison Toggle */}
                    <FormControlLabel
                        control={
                            <Switch
                                checked={comparePreviousYear}
                                onChange={(e) => setComparePreviousYear(e.target.checked)}
                                name="compare"
                                color="primary"
                                disabled={!availableYears.includes(previousYearKey)}
                            />
                        }
                        label="Compare Previous Year"
                        sx={{ color: theme.palette.text.secondary }}
                    />
                    
                    {/* Year Selector */}
                    <FormControl variant="outlined" size="small" sx={{ minWidth: 100 }}>
                        <InputLabel id="year-select-label">Year</InputLabel>
                        <Select
                            labelId="year-select-label"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            label="Year"
                        >
                            {availableYears.map((year) => (
                                <MenuItem key={year} value={year}>
                                    {year}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
            </Stack>

            {/* Chart Body */}
            <Box height={350}>
                <ResponsiveBar
                    data={chartData}
                    keys={keys} // Now Previous Year is first
                    groupMode="grouped" 
                    indexBy="month"
                    margin={{ top: 20, right: 20, bottom: 70, left: 80 }} 
                    padding={0.3}
                    valueScale={{ type: 'linear', max: maxValue }} 
                    indexScale={{ type: 'band', round: true }}
                    
                    // Dynamic Color Scheme
                    colors={({ id }) => 
                        id === selectedYear 
                            ? theme.palette.primary.main
                            : theme.palette.grey[500]   
                    }
                    
                    borderRadius={4} 
                    borderWidth={0}
                    
                    enableGridX={false} 
                    enableGridY={true}
                    gridYValues={5} 
                    
                    enableLabel={false}
                    
                    // LEGEND (only show when comparison is active)
                    legends={keys.length > 1 ? [
                        {
                            dataFrom: 'keys',
                            anchor: 'bottom-right',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 50,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemsSpacing: 5,
                            symbolSize: 12,
                            symbolShape: 'circle',
                            itemDirection: 'left-to-right',
                            itemTextColor: theme.palette.text.secondary,
                        }
                    ] : []}

                    axisBottom={{
                        tickRotation: 0,
                        tickSize: 0,
                        tickPadding: 12,
                    }}
                    axisLeft={{
                        tickSize: 0,
                        tickPadding: 10,
                        format: (value) => 
                            new Intl.NumberFormat('no-NO', { notation: "compact", compactDisplay: "short" }).format(value),
                    }}

                    tooltip={ComparisonTooltip}

                    theme={{
                        axis: {
                            ticks: {
                                text: {
                                    fontSize: 12,
                                    fill: theme.palette.text.secondary,
                                    fontFamily: theme.typography.fontFamily,
                                },
                            },
                        },
                        grid: {
                            line: {
                                stroke: theme.palette.divider,
                                strokeWidth: 1,
                                strokeDasharray: '4 4',
                            },
                        },
                    }}
                />
            </Box>
        </Paper>
    );
}