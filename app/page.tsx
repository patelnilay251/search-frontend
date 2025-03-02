import React from 'react'
import GeminiSearchResults from './components/GeminiSearchResults'
import { Box } from '@mui/material'

export default function Home() {
  return (
    <Box
      component="main"
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
        backgroundColor: '#000000',
      }}
    >
      <GeminiSearchResults />
    </Box>
  )
}