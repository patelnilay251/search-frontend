'use client'

import React from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import {Box} from '@mui/material'
import theme from './theme'
import Sidebar from './components/SideBar'
import {jetbrainsMono} from './font'

const sidebarItems = [
  { text: 'Home', href: '/' },
  { text: 'Search', href: '/' },
  { text: 'History', href: '/history' },
  { text: 'Settings', href: '/settings' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={jetbrainsMono.className}>
      {/* <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head> */}
      <body style={{ backgroundColor: '#000000', margin: 0, minHeight: '100vh' }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: 'flex' }}>
            <Sidebar items={sidebarItems}/>
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                ml: { xs: '60px', sm: '240px' },
                transition: 'margin-left 0.3s',
              }}
            >
              {children}
            </Box>
          </Box>    
        </ThemeProvider>
      </body>
    </html>
  )
}

