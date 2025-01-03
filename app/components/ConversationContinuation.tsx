'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Typography, Paper, Box, TextField, Button, List, ListItem, Avatar } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'

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

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

interface ConversationContinuationProps {
  summary: string;
}

export default function ConversationContinuation({ summary }: ConversationContinuationProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: summary, sender: 'bot' },
    { id: 2, text: "That's an interesting summary. Can you elaborate on the key points?", sender: 'user' },
    { id: 3, text: "The summary highlights several important aspects. First, it emphasizes the rapid advancements in AI technology, particularly in natural language processing and machine learning. These developments have led to more sophisticated chatbots and virtual assistants. Additionally, the summary touches on the ethical considerations surrounding AI, including privacy concerns and the potential impact on employment. Lastly, it mentions the growing integration of AI in various industries, from healthcare to finance, and its potential to revolutionize decision-making processes. Would you like me to expand on any of these points?", sender: 'bot' },
  ])
  const [newMessage, setNewMessage] = useState('')
  const [nextId, setNextId] = useState(4)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      const userMessage = { id: nextId, text: newMessage, sender: 'user' as const }
      setMessages(prevMessages => [...prevMessages, userMessage])
      setNewMessage('')
      setNextId(prevId => prevId + 1)

      // Simulate bot response
      setTimeout(() => {
        const botMessage = { 
          id: nextId + 1,
          text: "That's an interesting point. Based on the current developments in AI, we can expect to see even more advanced applications in the near future. For example, AI-driven personalized medicine could revolutionize healthcare by tailoring treatments to individual genetic profiles. In the realm of education, AI tutors might provide customized learning experiences for students. However, these advancements also raise important questions about data privacy and the ethical use of AI. What are your thoughts on balancing innovation with ethical considerations?", 
          sender: 'bot' as const
        }
        setMessages(prevMessages => [...prevMessages, botMessage])
        setNextId(prevId => prevId + 2)
      }, 1000)
    }
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh', 
        width: '100vw', 
        overflow: 'hidden',
        bgcolor: 'background.default'
      }}
    >
      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem', mb: 4 }}>
            Continue Conversation
          </Typography>
          <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
            <LayoutGroup>
              <List>
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      layout
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -50 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 50 }}
                    >
                      <ListItem sx={{ display: 'flex', justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', maxWidth: '80%' }}>
                          {message.sender === 'bot' && (
                            <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                              <SmartToyIcon />
                            </Avatar>
                          )}
                          <Paper 
                            elevation={0} 
                            sx={{ 
                              p: 2, 
                              bgcolor: message.sender === 'user' ? 'primary.main' : 'background.default',
                              color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                              borderRadius: message.sender === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0'
                            }}
                          >
                            <Typography variant="body1">{message.text}</Typography>
                          </Paper>
                          {message.sender === 'user' && (
                            <Avatar sx={{ bgcolor: 'secondary.main', ml: 1 }}>
                              <PersonIcon />
                            </Avatar>
                          )}
                        </Box>
                      </ListItem>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </List>
            </LayoutGroup>
            <div ref={messagesEndRef} />
          </Paper>
        </motion.div>
      </Box>
      <Box component="form" onSubmit={handleSendMessage} sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button 
            type="submit" 
            variant="contained" 
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              }
            }}
          >
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

