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
  // useTheme,
  // useMediaQuery,
} from '@mui/material'
import MinimalistLoader from './Loader'
import GeminiResults from './GeminiResults'
import BarChartIcon from '@mui/icons-material/BarChart'
import ChatIcon from '@mui/icons-material/Chat'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import QueryConveyor from './QueryConveyor'
import { useRouter } from 'next/navigation'
import { useConversationStore } from '../store/conversationStore'
import { v4 as uuidv4 } from 'uuid'

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

// const MOCK_SUMMARY_DATA: SummaryData = {
//   overview:
//     "Based on the analyzed search results about artificial intelligence in healthcare, there's significant progress in using AI for medical diagnosis, treatment planning, and patient care. The technology shows particular promise in medical imaging, early disease detection, and personalized medicine approaches.",
//   keyFindings: [
//     {
//       title: 'Medical Imaging Advancement',
//       description:
//         'AI algorithms have achieved 95% accuracy in detecting various conditions from X-rays, MRIs, and CT scans, particularly excelling in identifying early-stage cancers and cardiovascular conditions.',
//     },
//     {
//       title: 'Clinical Decision Support',
//       description:
//         'Healthcare providers using AI-powered systems reported a 30% reduction in diagnostic errors and a 25% improvement in treatment plan efficiency across various medical specialties.',
//     },
//     {
//       title: 'Patient Care Optimization',
//       description:
//         'Implementation of AI-driven patient monitoring systems has led to a 40% reduction in emergency response times and a 35% improvement in predicting patient deterioration in intensive care units.',
//     },
//   ],
//   conclusion:
//     'While AI shows tremendous potential in healthcare, successful implementation requires careful consideration of ethical implications, data privacy, and the need for human oversight. The technology serves best as a complement to, rather than replacement for, healthcare professionals.',
//   metadata: {
//     sourcesUsed: 15,
//     timeframe: '2020-2024',
//     queryContext: 'AI Healthcare Applications',
//   },
// }

// const MOCK_SEARCH_RESULTS: Result[] = [
//   {
//     title: 'AI in Healthcare: A Comprehensive Review of Current Applications',
//     text: "This systematic review examines the current state of artificial intelligence applications in healthcare, covering diagnostic accuracy, treatment optimization, and patient care management. The study analyzes data from 150 healthcare institutions...",
//     url: 'https://medical-ai-journal.org/comprehensive-review-2024',
//     score: 0.95,
//     publishedDate: '2024-01-15',
//   },
//   {
//     title: 'Machine Learning Models Improve Early Cancer Detection',
//     text: "Researchers at Stanford Medical Center have developed a new AI algorithm that can detect early-stage cancer with 92% accuracy. The system analyzes medical imaging data and patient history to identify potential malignancies...",
//     url: 'https://stanford-research.edu/ai-cancer-detection',
//     score: 0.92,
//     publishedDate: '2023-12-10',
//   },
//   {
//     title: 'Clinical Implementation of AI Decision Support Systems',
//     text: "A multi-center study involving 50 hospitals shows significant improvements in diagnostic accuracy and treatment outcomes when using AI-powered clinical decision support systems. The research demonstrates a 30% reduction in diagnostic errors...",
//     url: 'https://healthcare-innovation.org/ai-implementation',
//     score: 0.88,
//     publishedDate: '2023-11-28',
//   },
//   {
//     title: 'Ethics and Governance of AI in Healthcare',
//     text: "This paper discusses the ethical considerations and governance frameworks necessary for responsible AI implementation in healthcare settings. Topics include data privacy, algorithmic bias, and maintaining human oversight...",
//     url: 'https://bioethics-journal.org/ai-ethics-healthcare',
//     score: 0.85,
//     publishedDate: '2023-10-15',
//   },
//   {
//     title: 'AI-Driven Patient Monitoring Systems',
//     text: "New research highlights the effectiveness of AI-powered patient monitoring systems in intensive care units. The study reports a 40% reduction in emergency response times and improved prediction of patient deterioration...",
//     url: 'https://medical-technology-review.com/patient-monitoring',
//     score: 0.82,
//     publishedDate: '2023-09-20',
//   },
// ]

export default function GeminiSearchResults() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [query, setQuery] = useState('')
  const [searchKey, setSearchKey] = useState(0)
  const [showConveyor, setShowConveyor] = useState(true)
  const [progress, setProgress] = useState(0)

  const router = useRouter()
  const { setConversationSummaryData, setConversationId } = useConversationStore()

  //const theme = useTheme()
  //const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    setMounted(true)
    setShowConveyor(true)
  }, [])

  const fetchResults = async (query: string) => {
    setLoading(true)
    setProgress(0)
    setSearchKey((prevKey) => prevKey + 1)

    try {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 300)

      // // Simulate API call delay
      // await new Promise((resolve) => setTimeout(resolve, 1000))

      // setSummaryData(MOCK_SUMMARY_DATA)
      // setResults(MOCK_SEARCH_RESULTS)
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: { xs: 1, sm: 2 } }}>
            <IconButton
              component="a"
              href="/analytics"
              aria-label="analytics"
              sx={{
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)' },
              }}
            >
              <BarChartIcon />
            </IconButton>
          </Box>
          <motion.div initial="hidden" animate="visible" variants={containerVariants}>
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{ mb: { xs: 3, sm: 6 } }}
            >
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
                  <MinimalistLoader progress={progress} />
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
                    <Box
                      sx={{
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '4px',
                        p: { xs: 2, sm: 3 },
                        mb: { xs: 3, sm: 4 },
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
                            defaultExpanded
                            key={index}
                            sx={{
                              backgroundColor: 'transparent',
                              '&:before': { display: 'none' },
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              sx={{
                                borderBottom:
                                  '1px solid rgba(255, 255, 255, 0.12)',
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

                  {results.length > 0 && <GeminiResults results={results} />}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Container>
      </Box>
    </Box>
  )
}