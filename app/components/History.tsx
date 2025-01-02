'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Typography, List, ListItem, Paper, Container, Box } from '@mui/material'

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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.3
    }
  }
}

// Mock data for search history
const mockHistory = [
  { query: "AI advancements", date: "2023-06-01T10:30:00Z" },
  { query: "Quantum computing basics", date: "2023-05-30T14:45:00Z" },
  { query: "Renewable energy sources", date: "2023-05-28T09:15:00Z" },
  { query: "Machine learning algorithms", date: "2023-05-25T16:20:00Z" },
  { query: "Blockchain technology", date: "2023-05-22T11:00:00Z" },
]

export default function History() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem', mb: 4 }}>
          Search History
        </Typography>
        <List sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
          {mockHistory.map((item, index) => (
            <motion.div key={index} variants={itemVariants}>
              <ListItem component={Paper} elevation={0} sx={{ p: 3 }}>
                <Box sx={{ width: '100%' }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontSize: '1rem',
                      mb: 1
                    }}
                  >
                    {item.query}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ fontSize: '0.75rem' }}
                  >
                    {new Date(item.date).toLocaleString()}
                  </Typography>
                </Box>
              </ListItem>
            </motion.div>
          ))}
        </List>
      </motion.div>
    </Container>
  )
}

