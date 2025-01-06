'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Typography, 
  Paper, 
  Box, 
  TextField, 
  Button, 
  Container,
  useTheme,
  useMediaQuery,
  CircularProgress
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { useSearchParams } from 'next/navigation'

const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 30,
      duration: 0.5 
    }
  }
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const ContinueChat: React.FC = () => {
  const [query, setQuery] = useState('')
  const [summary, setSummary] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [nextId, setNextId] = useState(1)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const searchParams = useSearchParams()
  const chatBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const summaryParam = searchParams.get('summary')
    if (summaryParam) {
      setSummary(decodeURIComponent(summaryParam))
    }
  }, [searchParams])

  const scrollToBottom = () => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setLoading(true)
      const userMessage: Message = { id: nextId, text: query, sender: 'user' }
      setMessages(prev => [...prev, userMessage])
      setNextId(prev => prev + 1)
      setQuery('')

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      const botMessage: Message = { id: nextId + 1, text: `Response to: ${query}`, sender: 'bot' }
      setMessages(prev => [...prev, botMessage])
      setNextId(prev => prev + 2)
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 32px)' }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Box 
            ref={chatBoxRef}
            sx={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column',
              p: 3,
              pb: '80px', 
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'background.paper',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'divider',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'text.disabled',
                },
              },
            }}
          >
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 4, 
                borderRadius: 2,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
                Summary
              </Typography>
              <Typography variant="body1">
                {summary || "No summary provided. Start a new conversation or return to the search page to generate a summary."}
              </Typography>
            </Paper>

            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderRadius: 2,
                      bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                      color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                      alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      ml: message.sender === 'user' ? 'auto' : 0,
                      mr: message.sender === 'bot' ? 'auto' : 0,
                    }}
                  >
                    <Typography variant="body1">
                      {message.text}
                    </Typography>
                  </Paper>
                  {index < messages.length - 1 && (
                    <Box 
                      sx={{ 
                        height: '10px', 
                        width: '2px', 
                        bgcolor: 'divider',
                        margin: '0 auto'
                      }} 
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                style={{ alignSelf: 'flex-start', marginBottom: '10px' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Thinking...
                  </Typography>
                </Box>
              </motion.div>
            )}
          </Box>

          <Paper 
            component="form" 
            onSubmit={handleSend}
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              borderTop: '1px solid',
              borderColor: 'divider',
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type your message..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ 
                mr: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'transparent',
                  },
                  '&:hover fieldset': {
                    borderColor: 'transparent',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'transparent',
                  },
                },
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              endIcon={<SendIcon />}
              disabled={loading}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                px: 3,
                py: 1,
              }}
            >
              Send
            </Button>
          </Paper>
        </Paper>
      </motion.div>
    </Container>
  )
}

export default ContinueChat
