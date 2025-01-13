import React from 'react'
import { motion } from 'framer-motion'
import { Box, Typography, Paper } from '@mui/material'
import WbSunnyIcon from '@mui/icons-material/WbSunny'
import NightsStayIcon from '@mui/icons-material/NightsStay'
import CloudIcon from '@mui/icons-material/Cloud'

// Hardcoded weather data
const weatherData = {
  temperature: 22,
  condition: 'Sunny',
  location: 'New York',
  isDay: true,
}

const WeatherWidget: React.FC = () => {
  const getWeatherIcon = () => {
    if (weatherData.isDay) {
      return weatherData.condition === 'Sunny' ? <WbSunnyIcon /> : <CloudIcon />
    }
    return <NightsStayIcon />
  }

  const iconVariants = {
    sunny: {
      rotate: [0, 360],
      scale: [1, 1.2, 1],
      transition: {
        rotate: { repeat: Infinity, duration: 30, ease: "linear" },
        scale: { repeat: Infinity, duration: 5, ease: "easeInOut" }
      }
    },
    cloudy: {
      x: [-5, 5],
      transition: {
        x: { repeat: Infinity, duration: 3, ease: "easeInOut", repeatType: "reverse" }
      }
    },
    night: {
      opacity: [0.5, 1],
      transition: {
        opacity: { repeat: Infinity, duration: 2, ease: "easeInOut", repeatType: "reverse" }
      }
    }
  }

  const getIconAnimation = () => {
    if (weatherData.isDay) {
      return weatherData.condition === 'Sunny' ? 'sunny' : 'cloudy'
    }
    return 'night'
  }

  return (
    <Paper
      elevation={3}
      sx={{
        overflow: 'hidden',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <Box
        sx={{
          padding: '15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <motion.div
            animate={getIconAnimation()}
            variants={iconVariants}
            style={{ fontSize: '2.5rem', marginRight: '15px' }}
          >
            {getWeatherIcon()}
          </motion.div>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
              {weatherData.temperature}°C
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {weatherData.condition}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
            {weatherData.location}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {weatherData.isDay ? 'Day' : 'Night'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}

export default WeatherWidget

