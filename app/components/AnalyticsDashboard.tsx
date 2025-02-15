'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Typography, Paper, Container, Box, Button, Grid } from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, ZAxis } from 'recharts'

interface Result {
  title: string;
  text: string;
  url: string;
  score: number;
  publishedDate: string;
}

type ChartViewType = 'timeline' | 'relevance' | 'source';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.5
    }
  }
}

const processTimelineData = (results: Result[]) => {
  const groupedByDate = results.reduce((acc, result) => {
    const date = new Date(result.publishedDate).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(groupedByDate)
    .map(([date, count]) => ({
      date,
      count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const processRelevanceData = (results: Result[]) => {
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(result => ({
      title: result.title.slice(0, 30) + '...',
      score: result.score * 100,
    }));
};

const processSourceData = (results: Result[]) => {
  const sourceCount = results.reduce((acc, result) => {
    const domain = new URL(result.url).hostname;
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(sourceCount)
    .map(([source, count]) => ({
      source,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

interface AnalyticsDashboardProps {
  results: Result[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ results }) => {
  const [activeView, setActiveView] = useState<ChartViewType>('timeline');

  const renderChart = () => {
    switch (activeView) {
      case 'timeline':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={processTimelineData(results)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
              />
              <YAxis
                label={{ value: 'Number of Results', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8884d8"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'relevance':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processRelevanceData(results)}
              layout="vertical"
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis
                dataKey="title"
                type="category"
                tick={{ fontSize: 12 }}
                width={150}
              />
              <Tooltip />
              <Bar
                dataKey="score"
                fill="#82ca9d"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'source':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ bottom: 90 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="source"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                dataKey="count"
                label={{ value: 'Number of Articles', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis range={[100, 500]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter
                data={processSourceData(results)}
                fill="#ffc658"
              />
            </ScatterChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem', mb: 4 }}>
          Search Results Analytics
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button
            onClick={() => setActiveView('timeline')}
            variant={activeView === 'timeline' ? 'contained' : 'outlined'}
            sx={{ mr: 2 }}
          >
            Timeline View
          </Button>
          <Button
            onClick={() => setActiveView('relevance')}
            variant={activeView === 'relevance' ? 'contained' : 'outlined'}
            sx={{ mr: 2 }}
          >
            Relevance Scores
          </Button>
          <Button
            onClick={() => setActiveView('source')}
            variant={activeView === 'source' ? 'contained' : 'outlined'}
          >
            Source Distribution
          </Button>
        </Box>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                height: 500,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {renderChart()}
            </Paper>
          </motion.div>
        </AnimatePresence>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Total Results</Typography>
              <Typography variant="h4">{results.length}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Average Score</Typography>
              <Typography variant="h4">
                {(results.reduce((acc, r) => acc + r.score, 0) / results.length * 100).toFixed(1)}%
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6">Date Range</Typography>
              <Typography variant="h4">
                {`${new Date(Math.min(...results.map(r => new Date(r.publishedDate).getTime()))).toLocaleDateString()} - 
                 ${new Date(Math.max(...results.map(r => new Date(r.publishedDate).getTime()))).toLocaleDateString()}`}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default AnalyticsDashboard;