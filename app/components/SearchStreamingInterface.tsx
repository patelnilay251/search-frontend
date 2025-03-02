import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Typography, Box, Checkbox, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CheckIcon from '@mui/icons-material/Check'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

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
    const resultsContainerRef = useRef<HTMLDivElement>(null);
    const minimapRef = useRef<HTMLDivElement>(null);
    const [activeResultIndex, setActiveResultIndex] = useState<number | null>(null);
    const [newResults, setNewResults] = useState<number[]>([]);
    const lastResultsCount = useRef(0);

    // Track scroll position and update minimap highlight
    const handleScroll = () => {
        if (!resultsContainerRef.current) return;

        const { clientHeight } = resultsContainerRef.current;
        //const scrollBottom = scrollTop + clientHeight;
        const resultElements = resultsContainerRef.current.querySelectorAll('[data-result-index]');

        let closestIndex = null;
        let minDistance = Infinity;

        resultElements.forEach((el) => {
            const index = parseInt(el.getAttribute('data-result-index') || '0', 10);
            const rect = el.getBoundingClientRect();
            const elementMiddle = rect.top + rect.height / 2;
            const containerMiddle = clientHeight / 2 + resultsContainerRef.current!.getBoundingClientRect().top;
            const distance = Math.abs(elementMiddle - containerMiddle);

            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        setActiveResultIndex(closestIndex);
    };

    // Detect new results
    useEffect(() => {
        if (partialResults.length > lastResultsCount.current) {
            const newIndices: number[] = [];
            for (let i = lastResultsCount.current; i < partialResults.length; i++) {
                newIndices.push(i);
            }
            setNewResults(prev => [...prev, ...newIndices]);
            lastResultsCount.current = partialResults.length;

            // Auto-clear new status after 3 seconds
            setTimeout(() => {
                setNewResults(prev => prev.filter(idx => !newIndices.includes(idx)));
            }, 3000);
        }
    }, [partialResults.length]);

    // Set up scroll event listener
    useEffect(() => {
        const container = resultsContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // Scroll to specific result by index
    const scrollToResult = (index: number) => {
        if (resultsContainerRef.current) {
            const resultElement = resultsContainerRef.current.querySelector(`[data-result-index="${index}"]`);
            if (resultElement) {
                resultElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <Box
                sx={{
                    borderRadius: '0px',
                    backgroundColor: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'none',
                    overflow: 'hidden',
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Main header */}
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
                            borderRadius: '0px',
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
                    {stepMessage && (
                        <Box
                            sx={{
                                ml: 'auto',
                                px: 1.5,
                                py: 0.5,
                                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                borderRadius: '0px',
                                border: '1px solid rgba(33, 150, 243, 0.2)'
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontWeight: 500
                                }}
                            >
                                {stepMessage}
                            </Typography>
                        </Box>
                    )}
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
                                                    borderRadius: '0px',
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

                    {/* Right column - Search results with minimap */}
                    <Box
                        sx={{
                            width: '70%',
                            display: 'flex',
                            position: 'relative'
                        }}
                    >
                        {/* Main results container */}
                        <Box
                            ref={resultsContainerRef}
                            sx={{
                                flex: 1,
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
                                                    borderRadius: '0px',
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
                                                Searching for `{query}`
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
                                                    data-result-index={index}
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
                                                            transition: 'all 0.2s ease',
                                                            borderRadius: '0px',
                                                            pl: 1,
                                                            borderLeft: activeResultIndex === index
                                                                ? '2px solid #4CAF50'
                                                                : '2px solid transparent'
                                                        }}
                                                    >
                                                        <Box sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            mb: 0.5,
                                                            position: 'relative',
                                                        }}>
                                                            {/* New indicator for fresh results */}
                                                            {newResults.includes(index) && (
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
                                                borderRadius: '0px',
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

                        {/* Minimap navigation */}
                        {partialResults.length > 0 && (
                            <Box
                                ref={minimapRef}
                                sx={{
                                    width: '50px',
                                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    py: 1
                                }}
                            >
                                {/* Results minimap */}
                                <Box sx={{
                                    height: '100%',
                                    width: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    position: 'relative'
                                }}>
                                    {partialResults.map((_, index) => (
                                        <Box
                                            key={`minimap-${index}`}
                                            onClick={() => scrollToResult(index)}
                                            sx={{
                                                width: '20px',
                                                height: '4px',
                                                my: '1px',
                                                backgroundColor: newResults.includes(index)
                                                    ? '#4CAF50'
                                                    : activeResultIndex === index
                                                        ? 'rgba(255, 255, 255, 0.7)'
                                                        : 'rgba(255, 255, 255, 0.15)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    backgroundColor: activeResultIndex === index
                                                        ? 'rgba(255, 255, 255, 0.9)'
                                                        : 'rgba(255, 255, 255, 0.3)',
                                                    width: '28px'
                                                },
                                                ...(newResults.includes(index) && {
                                                    animation: 'pulse 2s infinite',
                                                    '@keyframes pulse': {
                                                        '0%': { opacity: 0.6 },
                                                        '50%': { opacity: 1 },
                                                        '100%': { opacity: 0.6 }
                                                    }
                                                })
                                            }}
                                        />
                                    ))}

                                    {/* Visible viewport indicator */}
                                    {activeResultIndex !== null && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                right: 0,
                                                width: '3px',
                                                height: '20px',
                                                backgroundColor: 'rgba(33, 150, 243, 0.9)',
                                                transition: 'top 0.3s ease',
                                                top: `${(activeResultIndex / Math.max(partialResults.length - 1, 1)) * 100}%`
                                            }}
                                        />
                                    )}
                                </Box>

                                {/* Jump to latest button */}
                                {partialResults.length > 0 && (
                                    <IconButton
                                        onClick={() => scrollToResult(partialResults.length - 1)}
                                        sx={{
                                            width: '30px',
                                            height: '30px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                            borderRadius: '0px',
                                            mt: 'auto',
                                            mb: 1,
                                            '&:hover': {
                                                backgroundColor: 'rgba(255, 255, 255, 0.15)'
                                            }
                                        }}
                                    >
                                        <ArrowDownwardIcon sx={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)' }} />
                                    </IconButton>
                                )}

                                {/* New results indicator */}
                                {newResults.length > 0 && (
                                    <Box
                                        component={motion.div}
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: [0.8, 1, 0.8] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        onClick={() => {
                                            const lastNewIndex = Math.max(...newResults);
                                            scrollToResult(lastNewIndex);
                                        }}
                                        sx={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '0px',
                                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                            border: '1px solid rgba(76, 175, 80, 0.5)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            mb: 1
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontWeight: 'bold',
                                                color: '#4CAF50',
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            {newResults.length}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </motion.div>
    )
}

export default SearchStreamingInterface