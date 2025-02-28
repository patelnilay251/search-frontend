import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Typography, Box, Checkbox, Fade } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/Check';

// Define interfaces for props
interface Result {
    title: string
    text: string
    url: string
    score: number
    publishedDate: string
}

interface SearchProgress {
    current: number
    total: number
}

interface SearchStreamingInterfaceProps {
    query: string
    stepMessage: string
    decomposedQueries: string[]
    searchProgress: SearchProgress
    partialResults: Result[]
    finalizing: boolean
}

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const getDomainFromUrl = (url: string) => {
    try {
        const domain = new URL(url).hostname.replace('www.', '');
        return domain;
    } catch {
        return url;
    }
};

const SearchStreamingInterface = ({
    query,
    stepMessage,
    decomposedQueries,
    searchProgress,
    partialResults,
    finalizing
}: SearchStreamingInterfaceProps) => {
    // Ref for the results container to enable autoscroll
    const resultsContainerRef = useRef<HTMLDivElement>(null);
    const lastResultRef = useRef<HTMLDivElement>(null);
    
    // Auto-scroll to the bottom when new results come in
    useEffect(() => {
        if (resultsContainerRef.current && partialResults.length > 0) {
            const container = resultsContainerRef.current;
            // Smooth scroll to bottom with animation
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [partialResults.length]);

    // Auto-scroll when finalizing status changes
    useEffect(() => {
        if (finalizing && resultsContainerRef.current) {
            const container = resultsContainerRef.current;
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [finalizing]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Box
                sx={{
                    borderRadius: '0px', // Sharp edges instead of rounded
                    backgroundColor: '#000000', // Pure black background
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'none', // Remove shadow for cleaner look
                    overflow: 'hidden',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Main header with search query */}
                <Box
                    sx={{
                        p: 2,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        backdropFilter: 'blur(10px)',
                        backgroundColor: 'rgba(0, 0, 0, 0.95)'
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 600,
                            fontSize: '1rem'
                        }}
                    >
                        DeepSearch
                    </Typography>
                    <Box
                        sx={{
                            ml: 1,
                            px: 1,
                            py: 0.5,
                            borderRadius: '0px', // Sharp edges
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        <Typography variant="caption" sx={{
                            fontWeight: 500,
                            color: 'rgba(255, 255, 255, 0.7)'
                        }}>
                            {partialResults.length} Sources
                        </Typography>
                    </Box>
                </Box>

                {/* Main content grid layout */}
                <Box sx={{ display: 'flex', height: 'calc(90vh - 56px)' }}>
                    {/* Left column - Query decomposition */}
                    <Box
                        sx={{
                            width: '30%',
                            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Box
                            sx={{
                                p: 2,
                                overflow: 'auto',
                                height: '100%'
                            }}
                        >
                            {decomposedQueries.length > 0 ? (
                                <Box>
                                    {decomposedQueries.map((subQuery, index) => (
                                        <motion.div
                                            key={`query-${index}`}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1, duration: 0.3 }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: 1,
                                                    mb: 2,
                                                    pl: 0.5,
                                                    pr: 1,
                                                    py: 1,
                                                    borderRadius: '0px', // Sharp edges
                                                    backgroundColor: index === searchProgress.current - 1
                                                        ? 'rgba(255, 255, 255, 0.08)'
                                                        : 'transparent',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >

                                                <motion.div
                                                    initial={{ opacity: 0.7 }}
                                                    animate={{
                                                        opacity: index < searchProgress.current ? 1 : 0.7,
                                                        scale: index < searchProgress.current ? [1, 1.05, 1] : 1
                                                    }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <Checkbox
                                                        checked={index < searchProgress.current}
                                                        icon={<Box sx={{ width: 18, height: 18, borderRadius: 0.5, border: '1px solid rgba(255, 255, 255, 0.2)', bgcolor: 'rgba(255, 255, 255, 0.08)' }} />}
                                                        checkedIcon={
                                                            <Box
                                                                sx={{
                                                                    width: 18,
                                                                    height: 18,
                                                                    borderRadius: 0.5,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    backgroundColor: 'rgba(76, 175, 80, 0.15)',
                                                                    border: '1.5px solid #4CAF50'
                                                                }}
                                                            >
                                                                <CheckIcon sx={{ fontSize: 14, color: '#4CAF50' }} />
                                                            </Box>
                                                        }
                                                        sx={{
                                                            padding: 0.5,
                                                            '&:hover': { bgcolor: 'transparent' }
                                                        }}
                                                        disableRipple
                                                    />
                                                </motion.div>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: 'rgba(255, 255, 255, 0.9)',
                                                        fontSize: '0.85rem',
                                                        lineHeight: 1.4,
                                                        flex: 1
                                                    }}
                                                >
                                                    {subQuery}
                                                </Typography>
                                            </Box>
                                        </motion.div>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    height: '100%'
                                }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            fontStyle: 'italic',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        Analyzing query...
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>

                    {/* Right column - Search results */}
                    <Box 
                        ref={resultsContainerRef}
                        sx={{
                            width: '70%',
                            overflow: 'auto',
                            scrollBehavior: 'smooth',
                            '&::-webkit-scrollbar': {
                                width: '8px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'rgba(255, 255, 255, 0.05)',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '0px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: 'rgba(255, 255, 255, 0.3)',
                            }
                        }}
                    >
                        <Box sx={{ p: 2 }}>
                            {/* Thinking/Current phase description */}
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 600,
                                    mb: 1.5,
                                    fontSize: '1rem'
                                }}
                            >
                                {stepMessage || 'Thinking'}
                            </Typography>

                            {query && (
                                <>
                                    {/* Bullet point description */}
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                                        <Box
                                            component="span"
                                            sx={{
                                                minWidth: '6px',
                                                height: '6px',
                                                borderRadius: '0px', // Sharp edges
                                                backgroundColor: 'white',
                                                mt: 1
                                            }}
                                        />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: 'rgba(255, 255, 255, 0.8)',
                                                fontSize: '0.85rem',
                                                lineHeight: 1.5
                                            }}
                                        >
                                            The request is about finding {query}. I think this means exploring options available.
                                        </Typography>
                                    </Box>

                                    {/* Current search query */}
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 2
                                    }}>
                                        <SearchIcon sx={{ fontSize: '0.9rem' }} />
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 500,
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            Searching for "{query}"
                                        </Typography>
                                    </Box>
                                </>
                            )}

                            {/* Results count */}
                            {partialResults.length > 0 && (
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 2
                                }}>
                                    <Box
                                        component="span"
                                        sx={{
                                            display: 'inline-block',
                                            width: '16px',
                                            height: '16px'
                                        }}
                                    >•</Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontSize: '0.85rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        {partialResults.length} results found
                                    </Typography>
                                </Box>
                            )}

                            {/* Results list */}
                            {partialResults.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <AnimatePresence>
                                        {partialResults.map((result, index) => (
                                            <motion.div
                                                key={`result-${index}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                                ref={index === partialResults.length - 1 ? lastResultRef : null}
                                            >
                                                <Box
                                                    sx={{
                                                        mb: 2.5,
                                                        pb: 2,
                                                        borderBottom: index < partialResults.length - 1 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                                                        position: 'relative',
                                                        '&:hover': {
                                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                        },
                                                        transition: 'background-color 0.2s ease',
                                                        borderRadius: '0px',
                                                        pl: 1
                                                    }}
                                                >
                                                    <Box sx={{ 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        mb: 0.5,
                                                        position: 'relative',
                                                    }}>
                                                        {/* New indicator for fresh results */}
                                                        {index === partialResults.length - 1 && (
                                                            <Box
                                                                component={motion.div}
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: [0.7, 1, 0.7] }}
                                                                transition={{ repeat: Infinity, duration: 2 }}
                                                                sx={{
                                                                    position: 'absolute',
                                                                    left: -10,
                                                                    top: '50%',
                                                                    transform: 'translateY(-50%)',
                                                                    width: 4,
                                                                    height: 16,
                                                                    backgroundColor: '#4CAF50',
                                                                    borderRadius: '0px'
                                                                }}
                                                            />
                                                        )}
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{
                                                                fontWeight: 600,
                                                                fontSize: '0.85rem',
                                                                color: 'rgba(255, 255, 255, 0.95)'
                                                            }}
                                                        >
                                                            {result.title.length > 25 ? `${result.title.slice(0, 30)}...` : result.title}
                                                        </Typography>

                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                ml: 'auto',
                                                                color: 'rgba(255, 255, 255, 0.5)',
                                                                fontSize: '0.75rem'
                                                            }}
                                                        >

                                                            {getDomainFromUrl(result.url)}
                                                        </Typography>
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: 'rgba(255, 255, 255, 0.7)',
                                                            fontSize: '0.8rem',
                                                            lineHeight: 1.4,
                                                            pl: 3.5
                                                        }}
                                                    >
                                                        {result.text}
                                                    </Typography>
                                                </Box>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {partialResults.length > 5 && (
                                        <Fade in={true}>
                                            <Box
                                                sx={{
                                                    position: 'sticky',
                                                    bottom: 16,
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    width: '100%',
                                                    pointerEvents: 'none',
                                                    zIndex: 5
                                                }}
                                            >
                                                <motion.div
                                                    animate={{ y: [0, 5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                >
                                                    <Box
                                                        sx={{
                                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                            color: 'rgba(255, 255, 255, 0.8)',
                                                            borderRadius: '0px',
                                                            px: 2,
                                                            py: 1,
                                                            fontSize: '0.75rem',
                                                            backdropFilter: 'blur(4px)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                                                        }}
                                                    >
                                                        Auto-scrolling as content loads
                                                    </Box>
                                                </motion.div>
                                            </Box>
                                        </Fade>
                                    )}
                                </Box>
                            )}

                            {/* Loading state */}
                            {partialResults.length === 0 && (
                                <Box sx={{
                                    p: 3,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <motion.div
                                        animate={{
                                            opacity: [0.5, 1, 0.5]
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 2
                                        }}
                                    >
                                        <Typography variant="body2" sx={{
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            fontStyle: 'italic',
                                            fontSize: '0.85rem'
                                        }}>
                                            Searching for relevant information...
                                        </Typography>
                                    </motion.div>
                                </Box>
                            )}

                            {/* Finalizing results notification */}
                            {finalizing && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Box
                                        sx={{
                                            mt: 3,
                                            p: 2,
                                            backgroundColor: 'rgba(33, 150, 243, 0.08)',
                                            borderRadius: '0px', // Sharp edges
                                            border: '1px solid rgba(33, 150, 243, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <motion.div
                                            animate={{
                                                opacity: [0.7, 1, 0.7]
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.5
                                            }}
                                        >
                                            <Typography variant="body2" sx={{
                                                fontWeight: 500,
                                                color: 'rgba(255, 255, 255, 0.8)',
                                                fontSize: '0.85rem'
                                            }}>
                                                Finalizing results and generating summary...
                                            </Typography>
                                        </motion.div>
                                    </Box>
                                </motion.div>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </motion.div>
    )
}

export default SearchStreamingInterface