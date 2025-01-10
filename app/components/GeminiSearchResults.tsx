'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Typography, 
  Container,
  Box, 
  TextField, 
  Button, 
  IconButton,  
} from '@mui/material'
import Loader from './Loader'
import GeminiResults from './GeminiResults'
import BarChartIcon from '@mui/icons-material/BarChart'
import ChatIcon from '@mui/icons-material/Chat'
import QueryConveyor from './QueryConveyor'



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

const contentVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.3
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
}

interface Result {
  title: string;
  text: string;
  url: string;
  score: number;
  publishedDate: string;
}

export default function GeminiSearchResults() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [summary, setSummary] = useState<string>('')
  const [query, setQuery] = useState('')
  const [searchKey, setSearchKey] = useState(0)
  //const [showConversation, setShowConversation] = useState(false)
  const [showConveyor, setShowConveyor] = useState(true)

  useEffect(() => {
    setMounted(true)
    setShowConveyor(true)
  }, [])

  const fetchResults = async (query: string) => {
    setLoading(true)
    setSearchKey(prevKey => prevKey + 1)
    console.log('Searching for:', query)

    try {
      const response = await fetch('http://localhost:3000/api/gemini-search', {
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
      setResults(data.searchResults || [])
      console.log('Summary state:', data.summaryData)
      console.log('Search results:', data.searchResults)
    } catch (error) {
      console.error('Error details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setShowConveyor(false)
      fetchResults(query)
    }
  }

  if (!mounted) return null

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <IconButton
          component="a"
          href="/analytics"
          aria-label="analytics"
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          <BarChartIcon />
        </IconButton>
      </Box>
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
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </motion.div>
          {showConveyor && (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                width: '100%',
                mt: 10
              }}
            >
              <QueryConveyor width="100%"/>
            </Box>
          )}
        </Box>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader />
            </motion.div>
          ) : (
            <motion.div
              key={`content-${searchKey}`}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {summary && (
                <Box sx={{ 
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '4px',
                  p: 3, 
                  mb: 4,
                  position: 'relative'
                }}>
                  <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem' }}>
                    Summary
                  </Typography>
                  <Typography variant="body1">{summary}</Typography>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      },
                    }}
                  >
                    <ChatIcon/>
                  </IconButton>
                </Box>
              )}

              {results.length > 0 && (
                <GeminiResults results={results}/>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Container>
  )
}