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
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'



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



export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const { summaryData, conversationId } = useConversationStore()
  const [message, setMessage] = useState('')
  const id = params?.id as string

  useEffect(() => {
    if (!summaryData || !id || conversationId !== id) {
      router.replace('/')
      return
    }
  }, [summaryData, conversationId, id, router])

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