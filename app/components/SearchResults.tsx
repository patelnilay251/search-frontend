'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Typography, List, ListItem, Paper, Container, Box, TextField, Button, CircularProgress, Link, Collapse } from '@mui/material'
import Loader from './Loader'

// Updated mock data with uniform text length
const mockData = {
  summaryData: "This is a mock summary of the search results. It provides a concise overview of the information found across multiple sources. The summary is designed to be clear, factual, and well-structured, giving users a quick understanding of the topic without the need to read through all individual results.",
  exaResponse: {
    results: [
      { title: "First Search Result", text: "This is the content of the first search result. It contains relevant information about the query. The text is designed to be of similar length for all results to ensure a uniform appearance in the search results list.", url: "https://example.com/result1", score: 0.8, publishedDate: "2022-01-01T00:00:00.000Z" },
      { title: "Second Search Result", text: "Here's the second search result with more details about the topic of interest. The content is crafted to match the length of other results, providing a consistent look and feel across all search result items displayed.", url: "https://example.com/result2", score: 0.7, publishedDate: "2022-01-15T00:00:00.000Z" },
      { title: "Third Search Result", text: "The third result provides additional context and information related to the search query. Like the others, this text is created to have a similar length, ensuring that all results have a uniform appearance when listed together.", url: "https://example.com/result3", score: 0.9, publishedDate: "2022-02-01T00:00:00.000Z" },
      { title: "Fourth Search Result", text: "This fourth result offers a different perspective on the topic being researched. The text length is carefully matched to other results, maintaining a consistent and visually appealing layout for all search results presented.", url: "https://example.com/result4", score: 0.6, publishedDate: "2022-03-01T00:00:00.000Z" },
      { title: "Fifth Search Result", text: "The final result in this list rounds out the information with concluding thoughts. As with the previous results, the text length is standardized to create a uniform appearance across all search result items in the list.", url: "https://example.com/result5", score: 0.5, publishedDate: "2022-04-01T00:00:00.000Z" }
    ]
  }
}

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
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.3
    }
  }
}

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  }
}

export default function SearchResults() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchResults = async (query: string) => {
    setLoading(true)
    console.log('Searching for:', query)

    try {
      const response = await fetch('http://localhost:3000/api/search', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setSummary(data.summaryData)
      setResults(data.exaResponse.results || [])
      console.log('Summary state:', data.summaryData)
      console.log('Final results state:', data.exaResponse.results || [])
    } catch (error) {
      console.error('Error details:', error)
    } finally {
      setLoading(false)
    }
}


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      fetchResults(query)
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  if (!mounted) return null

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 6 }}>
          <motion.div variants={itemVariants}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter your search query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                sx: { color: 'white' }
              }}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <Button 
              type="submit" 
              variant="outlined" 
              disabled={loading}
              sx={{
                width: '100%',
                height: '50px',
                fontSize: '0.875rem',
                color: 'black',
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: 'black',
                  color: 'white',
                }
              }}
            >
              {loading ? 'Searching...': 'Search'}
            </Button>
          </motion.div>
        </Box>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader/>
            </motion.div>
          )}
        </AnimatePresence>

        <Collapse in={Boolean(summary)} timeout={500}>
          <Paper elevation={0} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem' }}>
              Summary
            </Typography>
            <Typography variant="body1">{summary}</Typography>
          </Paper>
        </Collapse>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <Typography variant="h5" gutterBottom sx={{ fontSize: '1.25rem', mb: 3 }}>
                Search Results
              </Typography>
              <List sx={{ gap: 2, display: 'flex', flexDirection: 'column' }}>
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Container>
  )
}


