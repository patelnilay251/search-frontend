'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Box, Typography } from '@mui/material'
import { styled } from '@mui/system'

const StyledQuery = styled(motion.div)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  margin: theme.spacing(0.5),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: theme.shape.borderRadius,
  display: 'inline-block',
  whiteSpace: 'nowrap',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
  },
}))

const Row = ({ queries, speed }: { queries: string[], speed: number }) => {
  return (
    <motion.div
      style={{
        display: 'flex',
        whiteSpace: 'nowrap',
        marginBottom: '10px',
      }}
      animate={{
        x: [0, -1000],
      }}
      transition={{
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: speed,
          ease: "linear",
        },
      }}
    >
      {queries.concat(queries).map((query, index) => (
        <StyledQuery key={index}>
          <Typography variant="body2">{query}</Typography>
        </StyledQuery>
      ))}
    </motion.div>
  )
}

const queryData = [
  { queries: ["AI in healthcare", "Machine learning algorithms", "Data science trends", "Neural networks explained", "Deep learning applications"], speed: 20 },
  { queries: ["Quantum computing basics", "Blockchain technology", "Cybersecurity best practices", "Cloud computing services", "Internet of Things (IoT)"], speed: 25 },
  { queries: ["Renewable energy sources", "Climate change solutions", "Sustainable agriculture", "Electric vehicle technology", "Green building design"], speed: 22 },
  { queries: ["Space exploration news", "Exoplanet discoveries", "Mars colonization plans", "Asteroid mining potential", "Black hole research"], speed: 28 },
  // { queries: ["Genetic engineering ethics", "CRISPR technology", "Stem cell research", "Personalized medicine", "Bioinformatics advancements"], speed: 23 },
]

interface QueryConveyorProps {
  width?: string | number;
}

const QueryConveyor: React.FC<QueryConveyorProps> = ({ width = '100%' }) => {
  return (
    <Box
      sx={{
        width: width,
        overflow: 'hidden',
        padding: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 1,
        mb: 2,
      }}
    >
      {queryData.map((row, index) => (
        <Row key={index} queries={row.queries} speed={row.speed} />
      ))}
    </Box>
  )
}

export default QueryConveyor

