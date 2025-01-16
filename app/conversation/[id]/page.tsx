'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useConversationStore } from '../../store/conversationStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Avatar
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: Date
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
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const { summaryData, conversationId } = useConversationStore()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const id = params?.id as string

  useEffect(() => {
    if (!summaryData || !id || conversationId !== id) {
      router.replace('/')
      return
    }
  }, [summaryData, conversationId, id, router])

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage: Message = {
      id: Math.random().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: Math.random().toString(),
        text: "I understand your question about the summary. Based on the analysis, I can help you with that. What specific aspect would you like to explore further?",
        sender: 'ai',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiResponse])
    }, 1000)

    setMessage('')
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
            minHeight: 0,
            overflowY: 'auto',
            mb: 3,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.1)',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
            }
          }}>
            <List>
              {messages.map((msg) => (
                <ListItem
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                    gap: 2,
                    mb: 2,
                    padding: '8px 0'
                  }}
                >
                  <Avatar sx={{ 
                    bgcolor: msg.sender === 'user' ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32
                  }}>
                    {msg.sender === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                  </Avatar>
                  <Paper sx={{
                    p: 2,
                    maxWidth: '70%',
                    backgroundColor: msg.sender === 'user' ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    borderRadius: 2
                  }}>
                    <Typography variant="body1">
                      {msg.text}
                    </Typography>
                  </Paper>
                </ListItem>
              ))}
            </List>
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
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
              onClick={handleSendMessage}
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