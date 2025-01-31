'use client'

import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Chip, Tab, Tabs } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

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

interface FinancialData {
    overview: FinancialOverview;
    stockData: StockData[];
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

const FinancialVisualization: React.FC<FinancialVisualizationProps> = ({ data, context }) => {
    const [activeTab, setActiveTab] = useState(0);
    const { overview, stockData } = data;

    const keyMetrics = [
        { label: 'Market Cap', value: formatLargeNumber(overview.MarketCapitalization), icon: <ShowChartIcon /> },
        { label: 'P/E Ratio', value: parseFloat(overview.PERatio).toFixed(2), icon: <TrendingUpIcon /> },
        { label: 'Target Price', value: `$${overview.AnalystTargetPrice}`, icon: <AttachMoneyIcon /> },
    ];

    const chartData = [...stockData].reverse();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Box sx={{ width: '100%', p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2 }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
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
                                                p: 2,
                                                bgcolor: 'rgba(255, 255, 255, 0.07)',
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
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
                </motion.div>

                <Box sx={{ height: '300px', mt: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
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
                            />
                            <YAxis
                                stroke="rgba(255, 255, 255, 0.5)"
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: 'white'
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
                    </ResponsiveContainer>
                </Box>

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
                            fontSize: '0.875rem',
                            lineHeight: 1.5
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