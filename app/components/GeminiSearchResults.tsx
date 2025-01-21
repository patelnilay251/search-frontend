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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material'
import MinimalistLoader from './Loader'
import GeminiResults from './GeminiResults'
import BarChartIcon from '@mui/icons-material/BarChart'
import ChatIcon from '@mui/icons-material/Chat'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import QueryConveyor from './QueryConveyor'
//import WeatherWidget from './ui/WeatherWidget'
import { useRouter } from 'next/navigation'
import { useConversationStore } from '../store/conversationStore'
import { v4 as uuidv4 } from 'uuid'
import { useSearchParams } from 'next/navigation'

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

interface SummaryData {
  overview: string;
  keyFindings: {
    title: string;
    description: string;
  }[];
  conclusion: string;
  metadata: {
    sourcesUsed: number;
    timeframe: string;
    queryContext: string;
  };
}

export default function GeminiSearchResults() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [query, setQuery] = useState('')
  const [searchKey, setSearchKey] = useState(0)
  const [showConveyor, setShowConveyor] = useState(true)
  //const [showWeather, setShowWeather] = useState(true)
  const [progress, setProgress] = useState(0)
 
  const [initialRender, setInitialRender] = useState(true)

  const searchParams = useSearchParams()

  const router = useRouter()
  const { setConversationSummaryData, setConversationId } = useConversationStore()

 
  useEffect(() => {
    setMounted(true)
    setShowConveyor(true)
    //setShowWeather(true)
  }, [])

  const fetchResults = async (query: string) => {
    setLoading(true)
    setProgress(0)
    setSearchKey(prevKey => prevKey + 1)


    try {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 300)

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
      const parsedSummaryData = typeof data.summaryData === 'string' 
        ? JSON.parse(data.summaryData) 
        : data.summaryData
      setSummaryData(parsedSummaryData)
      setResults(data.searchResults || [])
    } catch (error) {
      console.error('Error details:', error)
    } finally {
      setProgress(100)
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

  const handleChatClick = () => {
    if (summaryData) {
      const conversationId = uuidv4()
      setConversationId(conversationId)
      setConversationSummaryData(summaryData)
      router.push(`/conversation/${conversationId}`)
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
              <MinimalistLoader progress={progress}/>
            </motion.div>
          ) : (
            <motion.div
              key={`content-${searchKey}`}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {summaryData && (
                <Box sx={{ 
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '4px',
                  p: 3, 
                  mb: 4,
                  position: 'relative'
                }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem' }}>
                      Overview
                    </Typography>
                    <Typography variant="body1">{summaryData.overview}</Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontSize: '1.25rem' }}>
                      Key Findings
                    </Typography>
                    {summaryData?.keyFindings?.map((finding, index) => (
                      <Accordion 
                        defaultExpanded
                        key={index}
                        sx={{ 
                          backgroundColor: 'transparent',
                          '&:before': {
                            display: 'none',
                          }
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{ 
                            borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
                          }}
                        >
                          <Typography>{finding.title}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography>{finding.description}</Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontSize: '1.25rem' }}>
                      Conclusion
                    </Typography>
                    <Typography variant="body1">{summaryData.conclusion}</Typography>
                  </Box>

                  <Box sx={{ 
                    mt: 3, 
                    pt: 2, 
                    borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.875rem'
                  }}>
                    <Typography variant="caption">
                      Sources: {summaryData?.metadata?.sourcesUsed} • 
                      Timeframe: {summaryData?.metadata?.timeframe}
                    </Typography>
                    <IconButton
                      onClick={handleChatClick}
                      sx={{
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        },
                      }}
                    >
                      <ChatIcon/>
                    </IconButton>
                  </Box>
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