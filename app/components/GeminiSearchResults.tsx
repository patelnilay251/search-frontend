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
  //Skeleton, // <-- ensure Skeleton is imported
} from '@mui/material'
//import MinimalistLoader from './MinimalistLoader'
import GeminiResults from './GeminiResults'
//import BarChartIcon from '@mui/icons-material/BarChart'
import ChatIcon from '@mui/icons-material/Chat'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import QueryConveyor from './QueryConveyor'
import { useRouter } from 'next/navigation'
import { useConversationStore } from '../store/conversationStore'
import AnalyticsDashboard from './AnalyticsDashboard'
import GeminiResultsExpanded from './GeminiResultsExpanded'
import SearchStreamingInterface from './SearchStreamingInterface'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.5,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
}

const contentVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 },
  },
}

interface Result {
  title: string
  text: string
  url: string
  score: number
  publishedDate: string
}

interface SummaryData {
  overview: string
  keyFindings: {
    title: string
    description: string
  }[]
  conclusion: string
  metadata: {
    sourcesUsed: number
    timeframe: string
    queryContext: string
  }
}

interface ProcessedResult {
  title: string;
  text: string;
  url: string;
  publishedDate: string;
  source: string;
  score: number;
}

// Add these new interfaces for streaming updates
// interface StreamUpdate {
//   type: 'decomposition' | 'search' | 'processing' | 'complete';
//   data: any;
// }

interface ProcessingStepData {
  step: 'decomposition' | 'search' | 'analysis';
  message: string;
}

interface DecompositionData {
  subQueries: string[];
}

interface SearchData {
  subQuery: string;
  results: ProcessedResult[];
  progress: {
    current: number;
    total: number;
  };
}

interface CompleteData {
  searchResults: ProcessedResult[];
  summaryData: string;
  originalQuery: string;
  conversationId?: string;
}

type StreamUpdate =
  | { type: 'decomposition'; data: DecompositionData }
  | { type: 'search'; data: SearchData }
  | { type: 'processing'; data: ProcessingStepData }
  | { type: 'complete'; data: CompleteData };
// interface SearchProgress {
//   current: number;
//   total: number;
// }

export default function GeminiSearchResults() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [query, setQuery] = useState('')
  const [searchKey, setSearchKey] = useState(0)
  const [showConveyor, setShowConveyor] = useState(true)
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [progress, setProgress] = useState(0)
  const [isResultsOpen, setIsResultsOpen] = useState(false)
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const [currentStep, setCurrentStep] = useState('')
  const [stepMessage, setStepMessage] = useState('')
  const [decomposedQueries, setDecomposedQueries] = useState<string[]>([])
  const [searchProgress, setSearchProgress] = useState({ total: 0, current: 0 })
  const [partialResults, setPartialResults] = useState<Result[]>([])
  const [finalizing, setFinalizing] = useState(false)

  const router = useRouter()
  const { setConversationSummaryData, setConversationId, conversationId } = useConversationStore()

  useEffect(() => {
    setMounted(true)
    setShowConveyor(true)
  }, [])

  const fetchResults = async (query: string) => {
    setLoading(true)
    setProgress(0)
    setSearchKey((prevKey) => prevKey + 1)

    // Reset all the streaming-related states
    setDecomposedQueries([])
    setCurrentStep('')
    setStepMessage('')
    setSearchProgress({ current: 0, total: 0 })
    setPartialResults([])
    setFinalizing(false)
    setSummaryData(null)
    setResults([])

    try {
      // For mock UI with a simple progress indicator
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval)
            return 100
          }
          return prev + 1
        })
      }, 100)

      // Set up EventSource for real-time updates
      const response = await fetch('/api/gemini-search', {
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

      // Process the stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Append chunk to buffer and process any complete events
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || '' // Keep the last incomplete chunk in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const update = JSON.parse(line.substring(6)) as StreamUpdate
              handleStreamUpdate(update)
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }

      clearInterval(progressInterval)
      setProgress(100)
    } catch (error) {
      console.error('Error details:', error)
      // Fallback to mock data in case of error
    } finally {
      setLoading(false)
    }
  }

  const handleStreamUpdate = (update: StreamUpdate) => {
    switch (update.type) {
      case 'processing':
        setCurrentStep(update.data.step)
        setStepMessage(update.data.message)
        if (update.data.step === 'search') {
          setFinalizing(false)
        }
        break
      case 'decomposition':
        setDecomposedQueries(update.data.subQueries)
        break
      case 'search':
        setSearchProgress({
          total: update.data.progress.total,
          current: update.data.progress.current,
        })
        setPartialResults((prev) => [...prev, ...update.data.results])
        break
      case 'complete':
        setResults(update.data.searchResults)
        setFinalizing(false)
        setLoading(false)
        setSummaryData(JSON.parse(update.data.summaryData))
        // Store the conversation data
        if (update.data.conversationId) {
          // If we received a conversation ID from the API, use it
          setConversationId(update.data.conversationId)
        }
        setConversationSummaryData(JSON.parse(update.data.summaryData))
        break
      default:
        break
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
    if (summaryData && conversationId) {
      // We now have a valid conversation ID from the API
      router.push(`/conversation/${conversationId}`)
    }
  }

  if (!mounted) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: { xs: '60px', sm: '240px' },
        right: 0,
        bottom: 0,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            <Box component="form" onSubmit={handleSearch} sx={{ mb: { xs: 3, sm: 6 } }}>
              <motion.div variants={itemVariants}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Enter your search query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  sx={{ mb: { xs: 2, sm: 2 } }}
                />
              </motion.div>
              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  variant="outlined"
                  disabled={loading}
                  sx={{
                    width: '100%',
                    height: { xs: '45px', sm: '50px' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    color: 'black',
                    backgroundColor: 'white',
                    '&:hover': { backgroundColor: 'black', color: 'white' },
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
                    mt: { xs: 5, sm: 10 },
                  }}
                >
                  <QueryConveyor width="100%" />
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
                  {/* <MinimalistLoader progress={progress} /> */}
                  <SearchStreamingInterface
                    query={query}
                    stepMessage={stepMessage}
                    decomposedQueries={decomposedQueries}
                    searchProgress={searchProgress}
                    partialResults={partialResults}
                    finalizing={finalizing}
                  />

                </motion.div>
              ) : (
                <motion.div
                  key={`content-${searchKey}`}
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >

                  {results.length > 0 && <GeminiResults results={results} />}
                  {results.length > 0 && (
                    <GeminiResultsExpanded
                      results={results}
                      isOpen={isResultsOpen}
                      onClose={() => setIsResultsOpen(false)}
                    />
                  )}

                  {summaryData && (
                    <Box
                      sx={{
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '4px',
                        p: { xs: 2, sm: 3 },
                        mb: { xs: 3, sm: 4 },
                        mt: { xs: 3, sm: 4 },
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                        <Typography variant="h4" gutterBottom>
                          Overview
                        </Typography>
                        <Typography variant="body1">
                          {summaryData.overview}
                        </Typography>
                      </Box>

                      <Divider sx={{ my: { xs: 1, sm: 2 } }} />

                      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                        <Typography variant="h5" gutterBottom>
                          Key Findings
                        </Typography>
                        {summaryData.keyFindings.map((finding, index) => (
                          <Accordion
                            key={index}
                            sx={{
                              backgroundColor: 'transparent',
                              '&:before': { display: 'none' },
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
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

                      <Divider sx={{ my: { xs: 1, sm: 2 } }} />

                      <Box sx={{ mb: { xs: 2, sm: 2 } }}>
                        <Typography variant="h5" gutterBottom>
                          Conclusion
                        </Typography>
                        <Typography variant="body1">
                          {summaryData.conclusion}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          mt: { xs: 2, sm: 3 },
                          pt: { xs: 1, sm: 2 },
                          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          gap: { xs: 1, sm: 0 },
                        }}
                      >
                        <Typography variant="caption">
                          Sources: {summaryData.metadata.sourcesUsed} • Timeframe:{' '}
                          {summaryData.metadata.timeframe}
                        </Typography>
                        <IconButton
                          onClick={handleChatClick}
                          sx={{
                            color: 'white',
                            alignSelf: { xs: 'flex-end', sm: 'center' },
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            },
                          }}
                        >
                          <ChatIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  )}

                  {results.length > 0 && <AnalyticsDashboard results={results} />}


                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Container>
      </Box>
    </Box>
  )
}