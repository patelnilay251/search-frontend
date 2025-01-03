'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Typography, Paper, Container, Box, TextField, Button, List, ListItem, Avatar } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

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
  text: string;
  sender: 'user' | 'bot';
}

interface ConversationContinuationProps {
  summary: string;
}

export default function ConversationContinuation({ summary }: ConversationContinuationProps) {
  const [messages, setMessages] = useState<Message[]>([
    { text: summary, sender: 'bot' },
    { text: "That's an interesting summary. Can you elaborate on the key points?", sender: 'user' },
    { text: "The summary highlights several important aspects. First, it emphasizes the rapid advancements in AI technology, particularly in natural language processing and machine learning. These developments have led to more sophisticated chatbots and virtual assistants. Additionally, the summary touches on the ethical considerations surrounding AI, including privacy concerns and the potential impact on employment. Lastly, it mentions the growing integration of AI in various industries, from healthcare to finance, and its potential to revolutionize decision-making processes. Would you like me to expand on any of these points?", sender: 'bot' },
  ])
  const [newMessage, setNewMessage] = useState('')

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim()) {
      setMessages([...messages, { text: newMessage, sender: 'user' }])
      setNewMessage('')
      // Simulate bot response
      setTimeout(() => {
        setMessages(prevMessages => [...prevMessages, { 
          text: "That's an interesting point. Based on the current developments in AI, we can expect to see even more advanced applications in the near future. For example, AI-driven personalized medicine could revolutionize healthcare by tailoring treatments to individual genetic profiles. In the realm of education, AI tutors might provide customized learning experiences for students. However, these advancements also raise important questions about data privacy and the ethical use of AI. What are your thoughts on balancing innovation with ethical considerations?", 
          sender: 'bot' 
        }])
      }, 1000)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Typography variant="h4" gutterBottom sx={{ fontSize: '1.5rem', mb: 4 }}>
          Continue Conversation
        </Typography>
        <Paper elevation={0} sx={{ p: 3, mb: 4, maxHeight: '60vh', overflowY: 'auto' }}>
          <List>
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
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
                          bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
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
        </Paper>
        <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 2 }}>
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
      </motion.div>
    </Container>
  )
}

