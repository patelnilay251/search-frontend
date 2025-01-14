import React from 'react'
import { motion } from 'framer-motion'
import { Box, Typography } from '@mui/material'

interface MinimalistLoaderProps {
  progress: number
}

const MinimalistLoader: React.FC<MinimalistLoaderProps> = ({ progress }) => {
  const searchTerms = ['Analyzing', 'Processing', 'Synthesizing', 'Finalizing']
  const currentTerm = searchTerms[Math.floor((progress / 100) * searchTerms.length)]

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  const progressVariants = {
    initial: { width: 0 },
    animate: { width: `${progress}%` },
  }

  const textVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
        <Typography variant="h6" sx={{ mb: 2, textAlign: 'center', color: 'white' }}>
          {currentTerm}
        </Typography>
        <Box sx={{ position: 'relative', height: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            variants={progressVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{
              position: 'absolute',
              height: '100%',
              backgroundColor: 'white',
              borderRadius: 2,
            }}
          />
        </Box>
        <motion.div
          variants={textVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
            {`${Math.round(progress)}% Complete`}
          </Typography>
        </motion.div>
      </Box>
    </motion.div>
  )
}

export default MinimalistLoader

