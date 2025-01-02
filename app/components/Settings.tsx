'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Typography, Paper, Container, Box, Switch, FormControlLabel, Slider, Button } from '@mui/material'

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

export default function Settings() {
  const [darkMode, setDarkMode] = useState(true)
  const [resultsPerPage, setResultsPerPage] = useState(5)
  const [autoSave, setAutoSave] = useState(true)

  const handleSaveSettings = () => {
    console.log('Settings saved:', { darkMode, resultsPerPage, autoSave })
    // Here you would typically save these settings to your backend or local storage
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem', mb: 4 }}>
          Settings
        </Typography>
        <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
          <motion.div variants={itemVariants}>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  name="darkMode"
                />
              }
              label="Dark Mode"
            />
          </motion.div>
        </Paper>
        <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
          <motion.div variants={itemVariants}>
            <Typography gutterBottom>Results per page: {resultsPerPage}</Typography>
            <Slider
              value={resultsPerPage}
              onChange={(_, newValue) => setResultsPerPage(newValue as number)}
              aria-labelledby="results-per-page-slider"
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={10}
            />
          </motion.div>
        </Paper>
        <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
          <motion.div variants={itemVariants}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  name="autoSave"
                />
              }
              label="Auto-save search history"
            />
          </motion.div>
        </Paper>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            variant="contained" 
            onClick={handleSaveSettings}
            sx={{
              backgroundColor: 'white',
              color: 'black',
              '&:hover': {
                backgroundColor: 'black',
                color: 'white',
              }
            }}
          >
            Save Settings
          </Button>
        </Box>
      </motion.div>
    </Container>
  )
}

