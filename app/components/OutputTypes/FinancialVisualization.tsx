'use client'

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import { motion } from 'framer-motion';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import ShowChart from '@mui/icons-material/ShowChart';

interface StockData {
    date: string;
    close: number;
    volume: number;
}

interface FinancialOverview {
    Symbol: string;
    Name: string;
    MarketCapitalization: string;
    PERatio: string;
    DividendYield: string;
    EPS: string;
    AnalystTargetPrice: string;
    [key: string]: string;
}

interface FinancialVisualizationProps {
    data: {
        overview: FinancialOverview;
        stockData: StockData[];
    };
    context: {
        description: string;
    };
}

const formatLargeNumber = (num: string) => {
    const n = parseFloat(num);
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${n.toFixed(2)}`;
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface ChartConfig {
    timeRange: '1D' | '1W' | '1M' | '3M' | '1Y';
    chartType: 'area' | 'candlestick';
    showVolume: boolean;
}

const FinancialVisualization: React.FC<FinancialVisualizationProps> = ({ data, context }) => {
    const { overview, stockData } = data;

    // Chart configuration state
    const [chartConfig, setChartConfig] = useState<ChartConfig>({
        timeRange: '1M',
        chartType: 'area',
        showVolume: false,
    });

    // Reverse the stock data to ensure chronological order (assuming the last element is the latest)
    const chartData = [...stockData].reverse();

    // Key metrics to display
    const keyMetrics = [
        { label: 'Market Cap', value: formatLargeNumber(overview.MarketCapitalization), icon: <ShowChartIcon /> },
        { label: 'P/E Ratio', value: parseFloat(overview.PERatio).toFixed(2), icon: <TrendingUpIcon /> },
        { label: 'Target Price', value: `$${overview.AnalystTargetPrice}`, icon: <AttachMoneyIcon /> },
    ];

    // Time range options
    const timeRanges: ('1D' | '1W' | '1M' | '3M' | '1Y')[] = ['1D', '1W', '1M', '3M', '1Y'];

    const handleTimeRangeChange = (
        event: React.MouseEvent<HTMLElement>,
        newRange: '1D' | '1W' | '1M' | '3M' | '1Y' | null
    ) => {
        if (newRange) {
            setChartConfig(prev => ({ ...prev, timeRange: newRange }));
        }
    };

    const handleChartTypeChange = (
        event: React.MouseEvent<HTMLElement>,
        newType: 'area' | 'candlestick' | null
    ) => {
        if (newType) {
            setChartConfig(prev => ({ ...prev, chartType: newType }));
        }
    };

    // Calculate the change in price from the first to the latest data point
    const calculateChange = () => {
        if (chartData.length < 2) return { value: 0, percentage: 0 };
        const latest = chartData[chartData.length - 1].close;
        const previous = chartData[0].close;
        const change = latest - previous;
        const percentage = (change / previous) * 100;
        return { value: change, percentage };
    };

    const change = calculateChange();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Box
                sx={{
                    width: '100%',
                    p: { xs: 2, sm: 3 },
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 2
                }}
            >
                {/* Header section */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                    <Typography
                        variant="h6"
                        sx={{
                            color: 'white',
                            mb: 1,
                            fontSize: { xs: '1rem', sm: '1.25rem' }
                        }}
                    >
                        {overview.Symbol} - {overview.Name}
                    </Typography>
                    <Grid container spacing={2}>
                        {keyMetrics.map((metric, index) => (
                            <Grid item xs={12} sm={4} key={index}>
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                >
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: { xs: 1, sm: 2 },
                                            bgcolor: 'rgba(255, 255, 255, 0.07)',
                                            borderRadius: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                        }}
                                    >
                                        {metric.icon}
                                        <Box>
                                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                                {metric.label}
                                            </Typography>
                                            <Typography variant="subtitle1" sx={{ color: 'white' }}>
                                                {metric.value}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </motion.div>
                            </Grid>
                        ))}
                    </Grid>
                </Box>

                {/* Chart controls */}
                <Box
                    sx={{
                        mb: 2,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        alignItems: 'center'
                    }}
                >
                    <ToggleButtonGroup
                        value={chartConfig.timeRange}
                        exclusive
                        onChange={handleTimeRangeChange}
                        size="small"
                    >
                        {timeRanges.map(range => (
                            <ToggleButton key={range} value={range}>
                                {range}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        value={chartConfig.chartType}
                        exclusive
                        onChange={handleChartTypeChange}
                        size="small"
                    >
                        <ToggleButton value="area">
                            <ShowChart />
                        </ToggleButton>
                        <ToggleButton value="candlestick">
                            <CandlestickChartIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Price change indicator */}
                <Box sx={{ mb: 2 }}>
                    <Typography
                        variant="h4"
                        sx={{ color: 'white', fontSize: { xs: '1.5rem', sm: '2rem' } }}
                    >
                        ${chartData[chartData.length - 1]?.close.toFixed(2)}
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            color: change.value >= 0 ? '#4caf50' : '#f44336',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                    >
                        {change.value >= 0 ? '▲' : '▼'}
                        {Math.abs(change.value).toFixed(2)} ({Math.abs(change.percentage).toFixed(2)}%)
                    </Typography>
                </Box>

                {/* Chart */}
                <Box sx={{ height: { xs: '250px', sm: '300px' }, mt: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {chartConfig.chartType === 'area' ? (
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    stroke="rgba(255, 255, 255, 0.5)"
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    stroke="rgba(255, 255, 255, 0.5)"
                                    tickFormatter={(value) => `$${value}`}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '8px',
                                        color: 'white',
                                    }}
                                    labelFormatter={formatDate}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="close"
                                    stroke="#8884d8"
                                    fillOpacity={1}
                                    fill="url(#colorPrice)"
                                />
                            </AreaChart>
                        ) : (
                            // Placeholder for candlestick chart
                            <Typography variant="body1" sx={{ color: 'white', textAlign: 'center' }}>
                                Candlestick chart not implemented.
                            </Typography>
                        )}
                    </ResponsiveContainer>
                </Box>

                {/* Context description */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            mt: 2,
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            lineHeight: 1.5,
                        }}
                    >
                        {context.description}
                    </Typography>
                </motion.div>
            </Box>
        </motion.div>
    );
};

export default FinancialVisualization;