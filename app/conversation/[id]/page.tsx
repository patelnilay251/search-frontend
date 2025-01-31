'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useConversationStore } from '../../store/conversationStore'
import { motion } from 'framer-motion'
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

interface VisualizationData {
  type: 'geographic' | 'financial'
  data: any | null
  status: 'success' | 'error'
  error?: string
}

interface VisualizationContext {
  type: 'geographic' | 'financial'
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

// Add this interface with the existing interfaces at the top of the file
interface APIMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  citations?: {
    number: number
    source: string
    url: string
  }[]
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
      data: message.visualizationData.data,
      context: message.visualizationContext
    };

    switch (message.visualizationData.type) {
      case 'geographic':
        return <GeographicVisualization {...props} />;
      case 'financial':
        return <FinancialVisualization {...props} />;
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

      {/* Add visualization after citations */}
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
  const router = useRouter()
  const params = useParams()
  const { summaryData, conversationId } = useConversationStore()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<null | HTMLDivElement>(null)
  const id = params?.id as string

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!summaryData || !id || conversationId !== id) {
      router.replace('/')
    }
  }, [summaryData, conversationId, id, router])

  const handleSend = async () => {
    if (!message.trim()) return

    const newUserMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, newUserMessage])
    setMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/gemini-search-sub', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: id,
          summaryData,
          previousMessages: messages.slice(-3)
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data: { messages: APIMessage[] } = await response.json()
      if (data.messages?.length) {
        setMessages(prev => [...prev, ...data.messages.map((msg: APIMessage) => ({
          ...msg,
          citations: msg.citations?.map((c) => ({
            ...c,
            url: c.url.startsWith('http') ? c.url : `https://${c.url}`
          }))
        }))])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!summaryData || !id) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 240,
        right: 0,
        bottom: 0,
        border: 'none',
        overflow: 'hidden'
      }}
    >
      <Box
        sx={{
          height: '100%',
          overflow: 'auto'
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            py: 4,
            minHeight: '100vh',
            px: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ maxWidth: '800px' }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" component="h1" gutterBottom sx={{ color: 'white' }}>
                {summaryData?.overview}
              </Typography>
            </Box>

            <Box>
              {messages.map((item, index) => (
                <Box
                  key={item.id}
                  sx={{
                    borderBottom: index !== messages.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
                  }}
                >
                  <MessageContent message={item} />
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ py: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.2
                        }}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#fff'
                        }}
                      />
                    ))}
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', ml: 1 }}>
                      Searching...
                    </Typography>
                  </Box>
                </Box>
              )}
              <div ref={messagesEndRef} /> {/* Add this line */}
            </Box>

            <Box sx={{ position: 'sticky', bottom: 20, mt: 4 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask a follow-up question..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={4}
                disabled={isLoading}
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  backdropFilter: 'blur(10px)',
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.23)' },
                    '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                    '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                  },
                  '& .MuiOutlinedInput-input': {
                    '&::placeholder': { color: 'rgba(255, 255, 255, 0.5)' },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={handleSend}
                      disabled={isLoading || !message.trim()}
                      sx={{
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}