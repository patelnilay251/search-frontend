'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Typography, Paper, Container, Box, Button} from '@mui/material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'


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

// const itemVariants = {
//   hidden: { opacity: 0, y: 20 },
//   visible: { 
//     opacity: 1,
//     y: 0,
//     transition: { 
//       duration: 0.3
//     }
//   }
// }

const trendData = [
  { name: 'Jan', searches: 4000 },
  { name: 'Feb', searches: 3000 },
  { name: 'Mar', searches: 5000 },
  { name: 'Apr', searches: 4500 },
  { name: 'May', searches: 6000 },
  { name: 'Jun', searches: 5500 },
]

const topicData = [
  { name: 'Technology', value: 400 },
  { name: 'Science', value: 300 },
  { name: 'Politics', value: 200 },
  { name: 'Entertainment', value: 100 },
]

// const wordCloudData = [
//   { text: 'AI', value: 64 },
//   { text: 'Machine Learning', value: 50 },
//   { text: 'Data Science', value: 40 },
//   { text: 'Neural Networks', value: 30 },
//   { text: 'Deep Learning', value: 25 },
//   { text: 'Big Data', value: 20 },
//   { text: 'Robotics', value: 15 },
//   { text: 'Computer Vision', value: 10 },
//   { text: 'Natural Language Processing', value: 8 },
//   { text: 'Quantum Computing', value: 5 },
// ]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AnalyticsDashboard() {
  const [activeChart, setActiveChart] = useState('trends')
  

  // useEffect(() => {
  //   if (activeChart === 'wordcloud') {
  //     const timer = setTimeout(() => setWordCloudReady(true), 1000)
  //     return () => clearTimeout(timer)
  //   }
  // }, [activeChart])

  // const wordcloudOptions = {
  //   rotations: 2,
  //   rotationAngles: [-90, 0],
  //   fontSizes: [20, 60],
  //   fontFamily: 'JetBrains Mono, monospace',
  //   colors: COLORS,
  //   padding: 2,
  // }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem', mb: 4 }}>
          Analytics Dashboard
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Button 
            onClick={() => setActiveChart('trends')}
            variant={activeChart === 'trends' ? 'contained' : 'outlined'}
            sx={{ mr: 2 }}
          >
            Search Trends
          </Button>
          <Button 
            onClick={() => setActiveChart('topics')}
            variant={activeChart === 'topics' ? 'contained' : 'outlined'}
            sx={{ mr: 2 }}
          >
            Topic Distribution
          </Button>
          <Button 
            onClick={() => setActiveChart('wordcloud')}
            variant={activeChart === 'wordcloud' ? 'contained' : 'outlined'}
          >
            Word Cloud
          </Button>
        </Box>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeChart}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Paper elevation={0} sx={{ p: 3, mb: 4, height: 400 }}>
              {activeChart === 'trends' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="searches" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              )}
              {activeChart === 'topics' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topicData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {topicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Paper>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </Container>
  )
}

