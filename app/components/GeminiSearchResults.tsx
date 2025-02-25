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
  Skeleton, // <-- ensure Skeleton is imported
} from '@mui/material'
import MinimalistLoader from './MinimalistLoader'
import GeminiResults from './GeminiResults'
import BarChartIcon from '@mui/icons-material/BarChart'
import ChatIcon from '@mui/icons-material/Chat'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import QueryConveyor from './QueryConveyor'
import { useRouter } from 'next/navigation'
import { useConversationStore } from '../store/conversationStore'
import { v4 as uuidv4 } from 'uuid'
import AnalyticsDashboard from './AnalyticsDashboard'
import GeminiResultsExpanded from './GeminiResultsExpanded'

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

const MOCK_SUMMARY_DATA: SummaryData = {
  overview:
    "Based on the analyzed search results about artificial intelligence in healthcare, there's significant progress in using AI for medical diagnosis, treatment planning, and patient care. The technology shows particular promise in medical imaging, early disease detection, and personalized medicine approaches.",
  keyFindings: [
    {
      title: 'Medical Imaging Advancement',
      description:
        'AI algorithms have achieved 95% accuracy in detecting various conditions from X-rays, MRIs, and CT scans, particularly excelling in identifying early-stage cancers and cardiovascular conditions.',
    },
    {
      title: 'Clinical Decision Support',
      description:
        'Healthcare providers using AI-powered systems reported a 30% reduction in diagnostic errors and a 25% improvement in treatment plan efficiency across various medical specialties.',
    },
    {
      title: 'Patient Care Optimization',
      description:
        'Implementation of AI-driven patient monitoring systems has led to a 40% reduction in emergency response times and a 35% improvement in predicting patient deterioration in intensive care units.',
    },
  ],
  conclusion:
    'While AI shows tremendous potential in healthcare, successful implementation requires careful consideration of ethical implications, data privacy, and the need for human oversight. The technology serves best as a complement to, rather than replacement for, healthcare professionals.',
  metadata: {
    sourcesUsed: 15,
    timeframe: '2020-2024',
    queryContext: 'AI Healthcare Applications',
  },
}

const MOCK_SEARCH_RESULTS: Result[] = [
  {
    title: 'AI in Healthcare: A Comprehensive Review of Current Applications',
    text: "This systematic review examines the current state of artificial intelligence applications in healthcare, covering diagnostic accuracy, treatment optimization, and patient care management. The study analyzes data from 150 healthcare institutions...",
    url: 'https://medical-ai-journal.org/comprehensive-review-2024',
    score: 0.95,
    publishedDate: '2024-01-15',
  },
  {
    title: 'Machine Learning Models Improve Early Cancer Detection',
    text: "Stanford researchers have developed a new AI algorithm achieving 92% accuracy in early-stage cancer detection. The system combines imaging analysis with patient history data to identify potential malignancies before traditional screening methods...",
    url: 'https://stanford-research.edu/ai-cancer-detection',
    score: 0.92,
    publishedDate: '2023-12-10',
  },
  {
    title: 'AI-Powered Drug Discovery Platform Shows Promise',
    text: "A breakthrough in pharmaceutical research as AI platform successfully predicts molecular behaviors and drug interactions with 89% accuracy. The system has already identified three potential candidates for treating resistant bacterial infections...",
    url: 'https://pharma-innovation.org/ai-drug-discovery',
    score: 0.88,
    publishedDate: '2023-11-28',
  },
  {
    title: 'Neural Networks Revolutionize Medical Imaging Analysis',
    text: "Deep learning algorithms now match or exceed radiologist performance in detecting abnormalities across various imaging modalities. The study covering 50,000 cases shows a 40% reduction in false positives while maintaining 95% sensitivity...",
    url: 'https://radiology-ai.edu/neural-networks',
    score: 0.87,
    publishedDate: '2023-10-15',
  },
  {
    title: 'AI in Emergency Medicine: Real-time Decision Support',
    text: "Implementation of AI-driven triage systems in emergency departments has led to a 35% improvement in patient prioritization accuracy and reduced wait times for critical cases by 28%. The system processes vital signs and symptoms in real-time...",
    url: 'https://emergency-med.org/ai-triage',
    score: 0.85,
    publishedDate: '2023-09-20',
  },
  {
    title: 'Predictive Analytics in Patient Care Management',
    text: "Healthcare facilities using AI-powered predictive analytics report a 45% reduction in hospital readmissions. The system identifies high-risk patients and recommends preventive interventions based on comprehensive health data analysis...",
    url: 'https://healthcare-analytics.com/predictive-care',
    score: 0.82,
    publishedDate: '2023-08-05',
  },
  {
    title: 'AI Ethics in Healthcare: Ensuring Responsible Implementation',
    text: "New framework addresses ethical considerations in healthcare AI deployment, focusing on data privacy, algorithmic bias, and patient autonomy. Guidelines developed through collaboration with medical ethicists and AI researchers...",
    url: 'https://medical-ethics.org/ai-guidelines',
    score: 0.78,
    publishedDate: '2023-07-12',
  },
  {
    title: 'Personalized Medicine Through AI Analysis',
    text: "AI algorithms now enable truly personalized treatment plans by analyzing individual genetic profiles, medical history, and lifestyle factors. Clinical trials show 30% better outcomes compared to standard treatment protocols...",
    url: 'https://precision-medicine.net/ai-personalization',
    score: 0.75,
    publishedDate: '2023-06-28',
  },
  {
    title: 'Mental Health Diagnosis Enhanced by AI',
    text: "Natural language processing algorithms achieve 85% accuracy in early detection of mental health conditions through analysis of patient communications. The system helps identify subtle patterns indicating potential psychological concerns...",
    url: 'https://mental-health-tech.org/ai-diagnosis',
    score: 0.72,
    publishedDate: '2023-05-15',
  },
  {
    title: 'AI-Assisted Surgical Planning and Navigation',
    text: "Robotic surgery systems enhanced with AI show 50% reduction in planning time and 25% improvement in precision. The technology provides real-time guidance and adapts to anatomical variations during procedures...",
    url: 'https://surgical-innovation.com/ai-surgery',
    score: 0.70,
    publishedDate: '2023-04-03',
  }
]

// Add these new interfaces for streaming updates
interface StreamUpdate {
  type: 'decomposition' | 'search' | 'processing' | 'complete';
  data: any;
}

interface SearchProgress {
  current: number;
  total: number;
}

export default function GeminiSearchResults() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [query, setQuery] = useState('')
  const [searchKey, setSearchKey] = useState(0)
  const [showConveyor, setShowConveyor] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isResultsOpen, setIsResultsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState('')
  const [stepMessage, setStepMessage] = useState('')
  const [decomposedQueries, setDecomposedQueries] = useState<string[]>([])
  const [searchProgress, setSearchProgress] = useState({ total: 0, current: 0 })
  const [partialResults, setPartialResults] = useState<Result[]>([])
  const [finalizing, setFinalizing] = useState(false)

  const router = useRouter()
  const { setConversationSummaryData, setConversationId } = useConversationStore()

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
      setSummaryData(MOCK_SUMMARY_DATA)
      setResults(MOCK_SEARCH_RESULTS)
    } finally {
      setLoading(false)
    }
  }

  const handleStreamUpdate = (update: StreamUpdate) => {
    switch (update.type) {
      case 'processing':
        setCurrentStep(update.data.step)
        setStepMessage(update.data.message)
        break

      case 'decomposition':
        setDecomposedQueries(update.data.subQueries)
        break

      case 'search':
        // Update search progress
        setSearchProgress(update.data.progress)

        // Add new results to existing partial results
        setPartialResults(prev => {
          // Combine existing results with new ones, avoiding duplicates
          const newResults = [...prev]
          update.data.results.forEach((result: Result) => {
            if (!newResults.some(r => r.url === result.url)) {
              newResults.push(result)
            }
          })
          // Sort by score
          return newResults.sort((a, b) => b.score - a.score)
        })
        break

      case 'complete':
        setFinalizing(false)

        // Parse summary data if needed
        const summaryDataParsed = typeof update.data.summaryData === 'string'
          ? JSON.parse(update.data.summaryData)
          : update.data.summaryData

        setSummaryData(summaryDataParsed)
        setResults(update.data.searchResults || [])
        break

      default:
        console.log('Unknown update type:', update.type)
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

                  {/* Real-time search info panel */}
                  <Box
                    sx={{
                      mt: 4,
                      p: 3,
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        mb: 2,
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <motion.div
                        animate={{
                          opacity: [0.5, 1, 0.5],
                          scale: [0.98, 1, 0.98]
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 2
                        }}
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: '#4CAF50',
                          display: 'inline-block'
                        }}
                      />
                      Searching for "{query}"
                    </Typography>

                    {/* Current step message displayed prominently */}
                    {stepMessage && (
                      <Box sx={{ mb: 3 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontStyle: 'italic',
                          }}
                        >
                          {stepMessage}
                        </Typography>
                      </Box>
                    )}

                    {/* Real-time query decomposition */}
                    {decomposedQueries.length > 0 && (
                      <Box sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, fontSize: '1rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                          Query Decomposition:
                        </Typography>
                        <Box sx={{ pl: 2, borderLeft: '2px solid rgba(255, 255, 255, 0.2)', mt: 1 }}>
                          {decomposedQueries.map((subQuery, index) => (
                            <motion.div
                              key={`query-${index}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <Typography
                                variant="body1"
                                component="div"
                                sx={{
                                  my: 1,
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  fontSize: '0.95rem',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 1
                                }}
                              >
                                <Box
                                  sx={{
                                    minWidth: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    mt: '2px'
                                  }}
                                >
                                  {index + 1}
                                </Box>
                                {subQuery}
                              </Typography>
                            </motion.div>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* Search progress indicator with count */}
                  {searchProgress.total > 0 && (
                    <Box
                      sx={{
                        mt: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        p: 1.5,
                        borderRadius: '6px'
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Search Progress
                        <Typography component="span" variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', ml: 1 }}>
                          {searchProgress.current} of {searchProgress.total} queries completed
                        </Typography>
                      </Typography>
                      <Box sx={{ width: '30%' }}>
                        <Box
                          sx={{
                            height: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              width: `${(searchProgress.current / searchProgress.total) * 100}%`,
                              backgroundColor: '#2196F3',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* Show partial search results in a cleaner layout */}
                  {partialResults.length > 0 && (
                    <Box
                      sx={{
                        mt: 4,
                        animation: 'fadeIn 0.5s ease-in-out',
                        '@keyframes fadeIn': {
                          '0%': { opacity: 0 },
                          '100%': { opacity: 1 }
                        },
                        p: 3,
                        borderRadius: '8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                          fontWeight: 500
                        }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        >
                          <BarChartIcon fontSize="small" sx={{ color: '#4CAF50' }} />
                        </motion.div>
                        Real-time Search Results
                      </Typography>

                      <Box sx={{ mt: 2 }}>
                        <GeminiResults results={partialResults.slice(0, 5)} />
                        {partialResults.length > 5 && (
                          <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontStyle: 'italic'
                              }}
                            >
                              + {partialResults.length - 5} more results being processed...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Show "Finalizing results" message */}
                  {finalizing && (
                    <Box
                      sx={{
                        mt: 4,
                        textAlign: 'center',
                        p: 2,
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderRadius: '8px',
                      }}
                    >
                      <motion.div
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5
                        }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          Finalizing your results and generating summary...
                        </Typography>
                      </motion.div>
                    </Box>
                  )}
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