'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, TextField, Button } from '@mui/material'

interface SearchPopupProps {
  isOpen: boolean
  onClose: () => void
}

const SearchPopup: React.FC<SearchPopupProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      console.log('Searching for:', query)
      // Here you would typically call your search function
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            zIndex: 1300,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              width: '100%',
              maxWidth: '600px',
              margin: '0 20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 3,
                backgroundColor: 'background.paper',
                borderRadius: 1,
                boxShadow: 24,
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Enter your search query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  sx: { color: 'text.primary' }
                }}
              />
              <Button 
                type="submit" 
                variant="outlined" 
                sx={{
                  width: '100%',
                  height: '50px',
                  fontSize: '0.875rem',
                  color: 'background.paper',
                  backgroundColor: 'text.primary',
                  '&:hover': {
                    backgroundColor: 'background.paper',
                    color: 'text.primary',
                  }
                }}
              >
                Search
              </Button>
            </Box>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SearchPopup

