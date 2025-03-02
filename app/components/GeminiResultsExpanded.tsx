import React, { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Typography, List, ListItem, Paper, Box, IconButton } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import Image from 'next/image'

interface Result {
    title: string
    text: string
    url: string
    score: number
    publishedDate: string
}

interface GeminiResultsPopupProps {
    results: Result[]
    isOpen: boolean
    onClose: () => void
}

const cardHoverVariants = {
    initial: { scale: 1, boxShadow: '0px 0px 0px rgba(255, 255, 255, 0)' },
    hover: {
        scale: 1.02,
        boxShadow: '0px 4px 20px rgba(255, 255, 255, 0.1)',
        transition: { duration: 0.2, ease: 'easeInOut' },
    },
    tap: { scale: 0.98 },
}

// const truncateText = (text: string, maxLength: number) => {
//     if (text.length <= maxLength) return text
//     return text.substr(0, maxLength) + '...'
// }

// Add this utility function at the top level
const getDomainFromUrl = (url: string) => {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain;
    } catch {
        return url;
    }
};

const GeminiResultsExpanded: React.FC<GeminiResultsPopupProps> = ({ results, isOpen, onClose }) => {
    const [isExpanded, setIsExpanded] = useState(true)
    const [isLoading, setIsLoading] = useState(false)

    const toggleExpand = () => {
        setIsLoading(true)
        setTimeout(() => {
            setIsExpanded(!isExpanded)
            setIsLoading(false)
        }, 500)
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
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 1300,
                    }}
                    onClick={onClose}
                >
                    {/* Modal container sliding in from the right */}
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: '400px', // Adjust the width as needed
                            backgroundColor: '#000',
                            overflowY: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                    >
                        <LayoutGroup>
                            <Box
                                sx={{
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                    backgroundColor: '#000',
                                }}
                            >
                                {/* Header */}
                                <Box
                                    sx={{
                                        position: 'sticky',
                                        top: 0,
                                        backgroundColor: '#000',
                                        zIndex: 1,
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        p: { xs: 1, sm: 2 },
                                    }}
                                >
                                    <Typography variant="h5" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, color: 'white' }}>
                                        Search Results
                                    </Typography>
                                    <IconButton onClick={toggleExpand} sx={{ color: 'white' }} disabled={isLoading}>
                                        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Box>

                                {/* Loading Spinner */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            padding: '20px',
                                        }}
                                    >
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 180, 360],
                                            }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                ease: 'linear',
                                            }}
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                border: '3px solid rgba(255, 255, 255, 0.2)',
                                                borderTop: '3px solid #fff',
                                                borderRadius: '50%',
                                            }}
                                        />
                                    </motion.div>
                                )}

                                <AnimatePresence>
                                    {isExpanded && !isLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Box
                                                sx={{
                                                    maxHeight: 'calc(100vh - 48px)', // full vertical space minus header
                                                    overflowY: 'auto',
                                                    '&::-webkit-scrollbar': { width: '8px' },
                                                    '&::-webkit-scrollbar-track': { background: '#1e1e1e' },
                                                    '&::-webkit-scrollbar-thumb': {
                                                        background: '#888',
                                                        borderRadius: '4px',
                                                    },
                                                    '&::-webkit-scrollbar-thumb:hover': { background: '#555' },
                                                }}
                                            >
                                                <List
                                                    sx={{
                                                        gap: { xs: 1, sm: 2 },
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        p: { xs: 1, sm: 2 },
                                                    }}
                                                >
                                                    {results.map((result, index) => (
                                                        <motion.div
                                                            key={index}
                                                            variants={cardHoverVariants}
                                                            initial="initial"
                                                            whileHover="hover"
                                                            whileTap="tap"
                                                        >
                                                            <ListItem
                                                                component={Paper}
                                                                elevation={0}
                                                                sx={{
                                                                    p: { xs: 1.5, sm: 2 },
                                                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                                    '&:hover': {
                                                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                                    },
                                                                }}
                                                            >
                                                                <Box sx={{ width: '100%' }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                        <Image
                                                                            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(result.url)}`}
                                                                            alt="Website favicon"
                                                                            width={16}
                                                                            height={16}
                                                                            unoptimized // Add this since we're loading from external URL
                                                                        />
                                                                        <Typography
                                                                            variant="caption"
                                                                            sx={{
                                                                                color: 'text.secondary',
                                                                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                                                            }}
                                                                        >
                                                                            {getDomainFromUrl(result.url)}
                                                                        </Typography>
                                                                        <Typography
                                                                            variant="caption"
                                                                            color="text.secondary"
                                                                            sx={{ ml: 'auto' }}
                                                                        >
                                                                            {(result.score * 100).toFixed(2)}%
                                                                        </Typography>
                                                                    </Box>

                                                                    <Typography
                                                                        variant="h6"
                                                                        component="a"
                                                                        href={result.url}
                                                                        target="_blank"
                                                                        sx={{
                                                                            color: 'primary.main',
                                                                            textDecoration: 'none',
                                                                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                                                            fontWeight: 'bold',
                                                                            display: 'block',
                                                                            mb: 1,
                                                                            '&:hover': { textDecoration: 'underline' },
                                                                        }}
                                                                    >
                                                                        {result.title}
                                                                    </Typography>

                                                                    {result.publishedDate && (
                                                                        <Typography
                                                                            variant="caption"
                                                                            component="div"
                                                                            color="text.secondary"
                                                                            sx={{
                                                                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                                                                opacity: 0.7
                                                                            }}
                                                                        >
                                                                            {new Date(result.publishedDate).toLocaleDateString()}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </ListItem>
                                                        </motion.div>
                                                    ))}
                                                </List>
                                            </Box>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Box>
                        </LayoutGroup>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default GeminiResultsExpanded