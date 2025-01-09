import React, { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Typography, List, ListItem, Paper, Box, Link, IconButton } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'

interface Result {
  title: string;
  text: string;
  url: string;
  score: number;
  publishedDate: string;
}

interface SearchResultsProps {
  results: Result[];
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

const GeminiResults: React.FC<SearchResultsProps> = ({ results }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleExpand = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsExpanded(!isExpanded);
      setIsLoading(false);
    }, 500); // Adjust this delay as needed
  };

  return (
    <LayoutGroup>
      <Box sx={{ 
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#000',
          zIndex: 1,
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
        }}>
          <Typography variant="h5" sx={{ fontSize: '1.25rem' }}>
            Search Results
          </Typography>
          <IconButton onClick={toggleExpand} sx={{ color: 'white' }} disabled={isLoading}>
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {isLoading && (
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
        )}

        <AnimatePresence>
          {!isExpanded && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  overflowX: 'auto',
                  p: 2,
                  '&::-webkit-scrollbar': {
                    height: '8px',
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
                }}
              >
                {results.slice(0, 4).map((result, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        width: 200,
                        height: 150,
                        m: 1,
                        p: 2,
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
                      <Typography
                        variant="h6"
                        component="a"
                        href={result.url}
                        target="_blank"
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'none',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {truncateText(result.title, 50)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                        {truncateText(result.text, 80)}
                      </Typography>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isExpanded && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
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
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
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
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                              {(result.score * 100).toFixed(2)}%
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
                              {new Date(result.publishedDate).toLocaleDateString()}
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
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </LayoutGroup>
  )
}

export default GeminiResults

