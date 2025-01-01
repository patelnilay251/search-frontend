import React from 'react'
import { motion } from 'framer-motion'
import { Box } from '@mui/material'

const containerVariants = {
  start: {
    transition: {
      staggerChildren: 0.2,
    },
  },
  end: {
    transition: {
      staggerChildren: 0.2,
    },
  },
}

const dotVariants = {
  start: {
    y: '0%',
  },
  end: {
    y: '100%',
  },
}

const dotTransition = {
  duration: 0.5,
  yoyo: Infinity,
  ease: 'easeInOut',
}

const Loader: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100px',
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="start"
        animate="end"
        style={{
          display: 'flex',
          gap: '10px',
        }}
      >
        {[...Array(3)].map((_, index) => (
          <motion.span
            key={index}
            variants={dotVariants}
            transition={dotTransition}
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: 'white',
              display: 'block',
            }}
          />
        ))}
      </motion.div>
    </Box>
  )
}

export default Loader

