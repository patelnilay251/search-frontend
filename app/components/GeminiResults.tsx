import React from 'react'
import { motion } from 'framer-motion'
import { Typography, List, ListItem, Paper, Box, Link } from '@mui/material'

interface Result {
  title: string;
  text: string;
  url: string;
  publishedDate: string;
}

interface SearchResultsProps {
  results: Result[];
  sx?: React.CSSProperties | { [key: string]: any };
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

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
}

const GeminiResults: React.FC<SearchResultsProps> = ({ results, sx }) => {
  return (
    <Box sx={{ 
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '4px',
      overflow: 'hidden',
      ...sx
    }}>
      <Box sx={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#000',
        zIndex: 1,
        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
      }}>
        <Typography variant="h5" sx={{ fontSize: '1.25rem', p: 2 }}>
          Search Results
        </Typography>
      </Box>
      <Box sx={{ 
        maxHeight: 'calc(60vh - 48px)',
        overflowY: 'auto', 
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#1e1e1e',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#555',
        },
      }}>
        <List sx={{ gap: 2, display: 'flex', flexDirection: 'column', p: 2 }}>
          {results.map((result, index) => (
            <motion.div key={index} variants={itemVariants}>
              <ListItem component={Paper} elevation={0} sx={{ p: 3 }}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography 
                      variant="h6" 
                      component="a" 
                      href={result.url} 
                      target="_blank" 
                      sx={{ 
                        color: 'primary.main',
                        textDecoration: 'none',
                        fontSize: '1rem',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      {result.title}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="caption" 
                    component="div" 
                    color="text.secondary" 
                    sx={{ mb: 1, fontSize: '0.75rem' }}
                  >
                    {result.url}
                  </Typography>
                  {result.publishedDate && (
                    <Typography 
                      variant="caption" 
                      component="div" 
                      color="text.secondary" 
                      sx={{ mb: 1, fontSize: '0.75rem' }}
                    >
                      {new Date(result.publishedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    {truncateText(result.text, 150)}
                    {result.text.length > 150 && (
                      <Link 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          console.log("Read more clicked for result:", index);
                        }}
                        sx={{ 
                          ml: 1,
                          color: 'primary.main',
                          textDecoration: 'none',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        Read more
                      </Link>
                    )}
                  </Typography>
                </Box>
              </ListItem>
            </motion.div>
          ))}
        </List>
      </Box>
    </Box>
  )
}

export default GeminiResults