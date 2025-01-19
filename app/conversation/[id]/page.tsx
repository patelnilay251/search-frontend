'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useConversationStore } from '../../store/conversationStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
  Link,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

// Updated interfaces
interface Citation {
  number: number
  source: string
  url: string
}

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string
  citations?: Citation[]
}

// Animation variants remain the same
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

const messageVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.3 }
  }
}

// Message component to handle citations and content
const MessageContent = ({ message }: { message: Message }) => {
  return (
    <CardContent>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {message.type === 'user' ? 'You' : 'AI Assistant'}
      </Typography>
      <Typography 
        variant="body1" 
        component="p" 
        sx={{ 
          color: 'white',
          whiteSpace: 'pre-wrap' // Preserves formatting
        }}
      >
        {message.content}
      </Typography>
      
      {message.citations && message.citations.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Sources:
          </Typography>
          {message.citations.map((citation) => (
            <Link
              key={citation.number}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.7)',
                textDecoration: 'none',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline'
                }
              }}
            >
              <Typography variant="caption">
                [{citation.number}] {citation.source}
              </Typography>
            </Link>
          ))}
        </Box>
      )}
      
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ mt: 1, display: 'block' }}
      >
        {new Date(message.timestamp).toLocaleString()}
      </Typography>
    </CardContent>
  )
}

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
      return
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId: id,
          summaryData,
          previousMessages: messages.slice(-3) // Send last 3 messages for context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      if (data.messages && Array.isArray(data.messages)) {
        // Filter out any user messages from the API response to prevent duplicates
        const assistantMessages = data.messages.filter((msg: Message) => msg.type === 'assistant')
        setMessages(prev => [...prev, ...assistantMessages])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Add error notification here if you want
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

  if (!summaryData || !id) {
    return null
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ height: '100%' }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Box sx={{ flex: '0 0 auto' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white' }}>
              Conversation Summary
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {summaryData.overview}
            </Typography>
          </Box>

          <Divider sx={{ my: 3, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />

          <Box sx={{
            flex: '1 1 auto',
            overflowY: 'auto',
            mb: 3,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.3)',
              },
            },
          }}>
            <Grid container spacing={2}>
              <AnimatePresence>
                {messages.map((item) => (
                  <Grid item xs={12} key={item.id}>
                    <motion.div
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                    >
                      <Card 
                        elevation={3}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(5px)',
                          borderRadius: '10px',
                        }}
                      >
                        <MessageContent message={item} />
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{
            flex: '0 0 auto',
            display: 'flex',
            gap: 2,
            alignItems: 'center'
          }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              multiline
              maxRows={4}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.23)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  },
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={isLoading || !message.trim()}
              sx={{
                color: 'primary.main',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </motion.div>
    </Container>
  )
}