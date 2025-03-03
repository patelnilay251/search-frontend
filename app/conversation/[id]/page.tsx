'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useConversationStore } from '../../store/conversationStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Container,
  Typography,
  Box,
  TextField,
  IconButton,
  Grid,
  Link,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import GeographicVisualization from '@/app/components/OutputTypes/GeographicVisualization'
import FinancialVisualization from '@/app/components/OutputTypes/FinancialVisualization'
import WeatherVisualization from '@/app/components/OutputTypes/WeatherVisualization'
import { getConversation } from '@/app/lib/supabase'

interface GeographicData {
  coordinates: {
    lat: number;
    lng: number;
  };
  formattedAddress: string;
  placeId: number;
  locationType: string;
}

interface GeographicVisualizationProps {
  data: GeographicData;
  context: {
    description: string;
  };
}

interface StockData {
  date: string;
  close: number;
  volume: number;
}

interface FinancialOverview {
  Symbol: string;
  Name: string;
  MarketCapitalization: string;
  PERatio: string;
  DividendYield: string;
  EPS: string;
  AnalystTargetPrice: string;
  [key: string]: string;
}

interface FinancialVisualizationProps {
  data: {
    overview: FinancialOverview;
    stockData: StockData[];
  };
  context: {
    description: string;
  };
}

interface WeatherData {
  location: string;
  current: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    wind_direction: number;
    feels_like: number;
    description: string;
    units: {
      temperature: string;
      wind_speed: string;
    };
  };
  hourly: {
    time: string[];
    temperature: number[];
    humidity: number[];
    precipitation_probability: number[];
    visibility: number[];
    uv_index: number[];
  };
  daily: {
    time: string[];
    temperature_max: number[];
    temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability: number[];
  };
  timestamp: string;
}

interface WeatherVisualizationProps {
  data: WeatherData;
  context: {
    description: string;
  };
}

interface VisualizationData {
  type: 'geographic' | 'financial' | 'weather'
  data: unknown;
  status: 'success' | 'error'
  error?: string
}

interface VisualizationContext {
  type: 'geographic' | 'financial' | 'weather'
  description: string
}

interface Citation {
  number: number
  source: string
  url: string
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  visualizationData?: VisualizationData
  visualizationContext?: VisualizationContext
  timestamp: string
}

const MessageContent = ({ message }: { message: Message }) => {
  const extractCitations = (content: string) => {
    return [...new Set(content.match(/\[\d+\]/g))].map(c => Number(c.replace(/[\[\]]/g, '')));
  };

  const citationNumbers = extractCitations(message.content);
  const validCitations = message.citations?.filter(c =>
    citationNumbers.includes(c.number)
  ) || [];

  const renderVisualization = () => {
    if (!message.visualizationData || !message.visualizationContext || message.visualizationData.data === null) {
      return null;
    }

    const props = {
      data: message.visualizationData.data as unknown,
      context: message.visualizationContext
    };

    switch (message.visualizationData.type) {
      case 'geographic':
        return <GeographicVisualization {...props as GeographicVisualizationProps} />;
      case 'financial':
        return <FinancialVisualization {...props as FinancialVisualizationProps} />;
      case 'weather':
        return <WeatherVisualization {...props as WeatherVisualizationProps} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          mb: 1,
          fontSize: '0.875rem'
        }}
      >
        {message.type === 'user' ? 'Search' : 'Answer'}
      </Typography>
      <Typography
        variant={message.type === 'user' ? 'h6' : 'body1'}
        component="div"
        sx={{
          color: 'white',
          whiteSpace: 'pre-wrap',
          mb: 2,
          fontWeight: message.type === 'user' ? 600 : 400,
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }
        }}
      >
        {message.content.split(/(\[\d+\])/g).map((part, i) => {
          if (part.match(/^\[\d+\]$/)) {
            const num = parseInt(part.replace(/[\[\]]/g, ''));
            const citation = validCitations.find(c => c.number === num);
            return citation ? (
              <Link
                key={i}
                href={citation.url}
                target="_blank"
                rel="noopener"
                sx={{ cursor: 'pointer' }}
              >
                {part}
              </Link>
            ) : part;
          }
          return part;
        })}
      </Typography>

      {validCitations.length > 0 && (
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
            Sources:
          </Typography>
          <Grid container spacing={1}>
            {validCitations.map((citation) => (
              <Grid item key={citation.number}>
                <Link
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '0.75rem',
                    textDecoration: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'primary.main'
                    }
                  }}
                >
                  [{citation.number}] {citation.source}
                </Link>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {renderVisualization() && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
            Visualization:
          </Typography>
          {renderVisualization()}
        </Box>
      )}
    </Box>
  );
};

export default function ConversationPage() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { id } = useParams<{ id: string }>()
  const {
    summaryData,
    setConversationSummaryData,
    setConversationId,
    messages: storeMessages,
    fetchMessages,
    addMessageToConversation,
  } = useConversationStore()

  // Use this to track if we have loaded the conversation data yet
  const [isInitialized, setIsInitialized] = useState(false)

  // Load conversation and messages data
  useEffect(() => {
    if (!id) return

    const loadConversation = async () => {
      try {
        setIsLoading(true)

        // Fetch conversation details
        const conversation = await getConversation(id as string)

        // Update the store with the conversation data
        setConversationId(conversation.id)

        try {
          // Try to parse the summary data from the conversation
          const summaryDataObj = JSON.parse(conversation.summary)
          setConversationSummaryData(summaryDataObj)
        } catch (e) {
          // If it's not valid JSON, just use it as is
          console.error('Error parsing summary data:', e)
        }

        // Fetch messages for this conversation
        await fetchMessages(id as string)

        setIsInitialized(true)
      } catch (error) {
        console.error('Error loading conversation:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversation()
  }, [id, setConversationId, setConversationSummaryData, fetchMessages])

  const handleSend = async () => {
    if (!input.trim() || isLoading || !id) return

    const userInput = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Add user message to the conversation
      await addMessageToConversation(
        userInput,
        'user',
        id as string
      )

      // Make API call to get assistant response
      const response = await fetch(`/api/conversation/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          conversationId: id,
          summaryData,
          previousMessages: storeMessages.slice(-3), // Send last 3 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const responseData = await response.json()

      // Add assistant message to the conversation
      await addMessageToConversation(
        responseData.answer,
        'assistant',
        id as string,
        responseData.citations || [],
        responseData.visualizationData || null,
        responseData.visualizationContext || null
      )
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
      setTimeout(scrollToBottom, 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  if (!summaryData || !id) return null

  return (
    <Container
      component={motion.div}
      maxWidth="lg"
      sx={{
        py: 4,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#000000',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Message Thread */}
      <Box sx={{ flex: 1, mb: 4, overflow: 'hidden' }}>
        <AnimatePresence>
          {isInitialized && storeMessages.length === 0 && summaryData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: '2rem' }}
            >
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background: 'rgba(30, 30, 30, 0.6)',
                  backdropFilter: 'blur(10px)',
                  mb: 3
                }}
              >
                <Typography variant="h5" sx={{ mb: 2, color: '#FFFFFF' }}>
                  Summary
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, color: '#CCCCCC' }}>
                  {summaryData.overview}
                </Typography>

                {summaryData.keyFindings?.length > 0 && (
                  <>
                    <Typography variant="h6" sx={{ mt: 3, mb: 1, color: '#FFFFFF' }}>
                      Key Findings
                    </Typography>
                    {summaryData.keyFindings.map((finding, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ color: '#FFFFFF' }}>
                          {finding.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                          {finding.description}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}

                {summaryData.conclusion && (
                  <>
                    <Typography variant="h6" sx={{ mt: 3, mb: 1, color: '#FFFFFF' }}>
                      Conclusion
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#AAAAAA' }}>
                      {summaryData.conclusion}
                    </Typography>
                  </>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {storeMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MessageContent message={message} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Box sx={{ display: 'flex', my: 2, mx: 2 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'grey.500',
                  mx: 0.5,
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.2 },
                    '50%': { opacity: 0.8 },
                    '100%': { opacity: 0.2 },
                  },
                  animationDelay: '0s',
                }}
              />
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'grey.500',
                  mx: 0.5,
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.2 },
                    '50%': { opacity: 0.8 },
                    '100%': { opacity: 0.2 },
                  },
                  animationDelay: '0.3s',
                }}
              />
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: 'grey.500',
                  mx: 0.5,
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.2 },
                    '50%': { opacity: 0.8 },
                    '100%': { opacity: 0.2 },
                  },
                  animationDelay: '0.6s',
                }}
              />
            </Box>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderRadius: 2,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(30, 30, 30, 0.6)',
        }}
      >
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a follow-up question..."
          fullWidth
          variant="outlined"
          onKeyDown={handleKeyPress}
          InputProps={{
            sx: {
              pr: 1,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
              color: 'white',
            },
          }}
        />
        <IconButton
          type="submit"
          color="primary"
          aria-label="send"
          disabled={isLoading || !input.trim()}
          sx={{
            backgroundColor: 'primary.main',
            color: '#fff',
            width: 40,
            height: 40,
            ml: 1,
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.3)',
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Container>
  )
}