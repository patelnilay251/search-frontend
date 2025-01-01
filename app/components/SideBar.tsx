import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Box, IconButton, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'

const sidebarVariants = {
  open: { width: 240, transition: { duration: 0.3 } },
  closed: { width: 60, transition: { duration: 0.3 } }
}

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true)

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <motion.div
      initial="open"
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: '#000',
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1200,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <IconButton onClick={toggleSidebar} sx={{ color: 'white' }}>
          {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      <List>
        {['Home', 'Search', 'History', 'Settings'].map((text, index) => (
          <ListItem 
            key={text}
            disablePadding
            sx={{ 
              justifyContent: isOpen ? 'flex-start' : 'center',
              px: isOpen ? 2 : 1
            }}
          >
            <ListItemButton>
              <ListItemText 
                primary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'white', 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: '0.875rem',
                      letterSpacing: '0.03em'
                    }}
                  >
                    {isOpen ? text : text.charAt(0)}
                  </Typography>
                } 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </motion.div>
  )
}

export default Sidebar

