import React, { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Typography, List, ListItem, Paper, Box, Link, IconButton, Button } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import GeminiResultsExpanded from './GeminiResultsExpanded'

interface Result {
  title: string;
  text: string;  // keeping for compatibility
  url: string;
  score: number;
  publishedDate: string;
}

// Add this utility function to extract domain name
const getDomainFromUrl = (url: string) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return url;
  }
};

interface SearchResultsProps {
  results: Result[];
}



const cardHoverVariants = {
  initial: { scale: 1, boxShadow: '0px 0px 0px rgba(255, 255, 255, 0)' },
  hover: {
    scale: 1.02,
    boxShadow: '0px 4px 20px rgba(255, 255, 255, 0.1)',
    transition: { duration: 0.2, ease: 'easeInOut' }
  },
  tap: { scale: 0.98 }
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

const GeminiResults: React.FC<SearchResultsProps> = ({ results }) => {
  const [isExpanded] = useState(false);
  const [isLoading] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);

  const handleOpen = () => {
    setIsResultsOpen(true);
  };

  return (
    <LayoutGroup>
      <Box
        sx={{
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#000',
            zIndex: 1,
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: { xs: 1, sm: 2 },
          }}
        >
          <Typography variant="h5" sx={{ fontSize: { xs: '0.5rem', sm: '0.95rem' } }}>
            Search Results
          </Typography>
          <IconButton onClick={handleOpen} sx={{ color: 'white' }} disabled={isLoading}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>

        </Box>

        {/* {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                width: '30px',
                height: '30px',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                borderTop: '3px solid #fff',
                borderRadius: '50%',
              }}
            />
          </motion.div>
        )} */}

        {/* Collapsed View */}
        <AnimatePresence>
          {!isExpanded && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box
                  sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    p: { xs: 1, sm: 2 },
                    '&::-webkit-scrollbar': { height: '8px' },
                    '&::-webkit-scrollbar-track': { background: '#1e1e1e' },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#888',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
                  }}
                >
                  {results.slice(0, 15).map((result, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >

                      <Paper
                        elevation={0}
                        sx={{
                          width: { xs: 120, sm: 160 },  // reduced width
                          height: { xs: 80, sm: 100 },  // reduced height
                          m: { xs: 0.5, sm: 1 },
                          p: { xs: 1, sm: 1.5 },
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          transition: 'background-color 0.3s',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(result.url)}`}
                            alt=""
                            style={{ width: 16, height: 16 }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontSize: { xs: '0.5rem', sm: '0.6rem' },
                            }}
                          >
                            {getDomainFromUrl(result.url)}
                          </Typography>
                        </Box>
                        <Typography
                          variant="h6"
                          component="a"
                          href={result.url}
                          target="_blank"
                          sx={{
                            color: 'primary.main',
                            textDecoration: 'none',
                            fontSize: { xs: '0.6rem', sm: '0.7rem' },
                            fontWeight: 'bold',
                            '&:hover': { textDecoration: 'underline' },
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {result.title}
                        </Typography>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
      <GeminiResultsExpanded
        results={results}
        isOpen={isResultsOpen}
        onClose={() => setIsResultsOpen(false)}
      />
    </LayoutGroup>
  );
};

export default GeminiResults;