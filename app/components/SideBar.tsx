import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Box, IconButton, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import Link from 'next/link'
import SearchPopup from '../components/SearchPopup'

const sidebarVariants = {
  open: { width: 240, transition: { duration: 0.3 } },
  closed: { width: 60, transition: { duration: 0.3 } }
}

interface SidebarProps {
    items: { text: string; href: string }[]
  }
  

const Sidebar : React.FC<SidebarProps> = ({ items}) => {
  const [isOpen, setIsOpen] = useState(true)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const toggleSidebar = () => setIsOpen(!isOpen)

  const handleItemClick = (text: string) => {
    if (text === 'Search') {
      setIsSearchOpen(true)
    }
  }

  return (
    // <motion.div
    //   initial="open"
    //   animate={isOpen ? "open" : "closed"}
    //   variants={sidebarVariants}
    //   style={{
    //     position: 'fixed',
    //     top: 0,
    //     left: 0,
    //     bottom: 0,
    //     backgroundColor: '#000',
    //     borderRight: '1px solid rgba(255, 255, 255, 0.12)',
    //     display: 'flex',
    //     flexDirection: 'column',
    //     zIndex: 1200,
    //     overflow: 'hidden'
    //   }}
    // >
    //   <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
    //     <IconButton onClick={toggleSidebar} sx={{ color: 'white' }}>
    //       {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
    //     </IconButton>
    //   </Box>
    //   <List>
    //     {items.map((item) => (
    //       <ListItem 
    //         key={item.text}
    //         disablePadding
    //         sx={{ 
    //           justifyContent: isOpen ? 'flex-start' : 'center',
    //           px: isOpen ? 2 : 1
    //         }}
    //       >
    //        <Link href={item.href} passHref style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
    //           <ListItemButton>
    //             <ListItemText 
    //               primary={
    //                 <Typography 
    //                   variant="body2" 
    //                   sx={{ 
    //                     color: 'white', 
    //                     whiteSpace: 'nowrap',
    //                     overflow: 'hidden',
    //                     textOverflow: 'ellipsis',
    //                     fontSize: '0.875rem',
    //                     letterSpacing: '0.03em'
    //                   }}
    //                 >
    //                   {isOpen ? item.text : item.text.charAt(0)}
    //                 </Typography>
    //               } 
    //             />
    //           </ListItemButton>
    //         </Link>
    //       </ListItem>
    //     ))}
    //   </List>
    // </motion.div>

    <>
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
        {items.map((item) => (
          <ListItem 
            key={item.text}
            disablePadding
            sx={{ 
              justifyContent: isOpen ? 'flex-start' : 'center',
              px: isOpen ? 2 : 1
            }}
          >
            {item.text === 'Search' ? (
              <ListItemButton onClick={() => handleItemClick(item.text)}>
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
                      {isOpen ? item.text : item.text.charAt(0)}
                    </Typography>
                  } 
                />
              </ListItemButton>
            ) : (
              <Link href={item.href} passHref style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
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
                        {isOpen ? item.text : item.text.charAt(0)}
                      </Typography>
                    } 
                  />
                </ListItemButton>
              </Link>
            )}
          </ListItem>
        ))}
      </List>
    </motion.div>
    <SearchPopup isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
  </>
  )
}

export default Sidebar

