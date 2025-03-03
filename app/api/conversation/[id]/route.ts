import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getMessages, getSearchResults, addMessage } from '@/app/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { fetchFinancialData } from '../../data-fetchers/financial-data';
import { fetchWeatherData } from '../../data-fetchers/weather-data';
import { fetchGeographicData } from '../../data-fetchers/geo-data';

interface Citation {
    number: number;
    source: string;
    url: string;
}

interface VisualizationData {
    type: 'geographic' | 'financial' | 'weather';
    data: unknown;
    status: 'success' | 'error';
    error?: string;
}

interface VisualizationContext {
    type: 'geographic' | 'financial' | 'weather';
    description: string;
}

interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
    visualization_data?: VisualizationData;
    visualization_context?: VisualizationContext;
    timestamp: string;
}

interface ConversationRequest {
    message: string;
    conversationId: string;
    summaryData: SummaryData;
    previousMessages: Message[];
}

interface SummaryData {
    overview: string;
    keyFindings: {
        title: string;
        description: string;
    }[];
    conclusion: string;
    metadata: {
        sourcesUsed: number;
        timeframe: string;
        queryContext: string;
    };
}

interface Visualization {
    type: 'none' | 'geographic' | 'financial' | 'weather';
    entities: string[];
    confidence: number;
    details?: {
        stockSymbol?: string;
        location?: string;
    };
}

interface EnrichedResult {
    enrichedQuery: string;
    visualization: Visualization;
}

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Analyze the query for potential visualization needs
async function analyzeQueryForVisualization(
    query: string,
    summaryOverview: string,
    conversationContext: string
): Promise<{ visualizationType: 'none' | 'geographic' | 'financial' | 'weather', visualizationData: unknown | null, enrichedQuery: string }> {
    const combinedPrompt = `Analyze the following query and provide both search optimization and visualization needs.

        Query: "${query}"
        Context: "${summaryOverview}"
        Conversation: "${conversationContext}"

        Respond in JSON format only:
        {
            "enrichedQuery": "optimized search query",
            "visualization": {
                "type": "none" | "geographic" | "financial" | "weather",
                "entities": ["use stock symbol for companies, full name for locations"],
                "confidence": 0-1 score,
                "details": {
                    "stockSymbol": "AAPL",
                    "location": "Paris"
                }
            }
        }

        Examples:
        Query: "How is Apple stock performing after Vision Pro launch?"
        Response: {
            "enrichedQuery": "Apple AAPL stock performance Vision Pro launch impact",
            "visualization": {
                "type": "financial",
                "entities": ["AAPL"],
                "confidence": 1,
                "details": { "stockSymbol": "AAPL" }
            }
        }

        Query: "Tourist attractions near Eiffel Tower"
        Response: {
            "enrichedQuery": "popular tourist attractions landmarks near Eiffel Tower Paris",
            "visualization": {
                "type": "geographic",
                "entities": ["Eiffel Tower, Paris"],
                "confidence": 1,
                "details": { "location": "Paris" }
            }
        }

        Query: "What's the weather like in Tokyo?"
        Response: {
            "enrichedQuery": "current weather conditions Tokyo Japan",
            "visualization": {
                "type": "weather",
                "entities": ["Tokyo, Japan"],
                "confidence": 1,
                "details": { "location": "Tokyo" }
            }
        }`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent(combinedPrompt);
        const analysisText = result.response.text().trim();

        const cleanedText = analysisText.replace(/```json\s*\n?/, '').replace(/```/, '').trim();
        const parsedResult: EnrichedResult = JSON.parse(cleanedText);

        const visualizationData = parsedResult.visualization;
        let additionalData: unknown | null = null;

        if (visualizationData && visualizationData.confidence > 0.7) {
            if (visualizationData.type === 'geographic' && visualizationData.entities.length > 0) {
                additionalData = await fetchGeographicData(visualizationData.entities[0]);
            } else if (visualizationData.type === 'financial' && visualizationData.details?.stockSymbol) {
                additionalData = await fetchFinancialData(visualizationData.details.stockSymbol);
            } else if (visualizationData.type === 'weather' && visualizationData.details?.location) {
                additionalData = await fetchWeatherData(visualizationData.details.location);
            }
        }

        return {
            visualizationType: visualizationData.type,
            visualizationData: additionalData,
            enrichedQuery: parsedResult.enrichedQuery
        };
    } catch (error) {
        console.error('Error analyzing query for visualization:', error);
        return {
            visualizationType: 'none',
            visualizationData: null,
            enrichedQuery: query
        };
    }
}

function isValidVisualizationType(type: string): type is 'geographic' | 'financial' | 'weather' {
    return type === 'geographic' || type === 'financial' || type === 'weather';
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { message, summaryData } = await req.json() as ConversationRequest;
        const paramsData = await params;
        const conversationId = paramsData.id;

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
        }

        // Get existing messages and search results for context
        const existingMessages = await getMessages(conversationId);
        const searchResults = await getSearchResults(conversationId);

        // Format the conversation context
        const conversationContext = existingMessages
            .slice(-3) // Last 3 messages for recency
            .map((msg) => `${msg.type.toUpperCase()}: ${msg.content}`)
            .join('\n\n');

        // Check if this query might need visualization
        const visualizationAnalysis = await analyzeQueryForVisualization(
            message,
            summaryData?.overview || '',
            conversationContext
        );

        const visualizationType = visualizationAnalysis.visualizationType;
        const visualizationData = visualizationAnalysis.visualizationData;
        const enrichedQuery = visualizationAnalysis.enrichedQuery;

        // Format search results for context
        const searchContext = searchResults
            .sort((a, b) => b.score - a.score)
            .slice(0, 10) // Top 10 results
            .map((result, index) =>
                `[${index + 1}] ${result.source}: ${result.title}\n${result.text}`
            )
            .join('\n\n');

        // Create a more structured prompt for Gemini
        const systemPrompt = `You are an AI assistant providing detailed, accurate responses. ALWAYS RESPOND WITH VALID JSON FORMAT:

        {
        "response": "Your formatted response with [1][2] citations",
        "citations": [
            {
            "number": 1,
            "source": "example.com",
            "url": "https://example.com/article"
            }
        ],
        "visualizationContext": {
            "type": "${visualizationType}",
            "description": "Brief description of why this visualization is relevant"
        }
        }

        CONVERSATION CONTEXT:
        Topic Summary: ${summaryData?.overview || "No summary available"}
        Previous Messages: ${conversationContext}
        CURRENT QUERY: "${message}"
        SEARCH RESULTS: ${searchContext}
        ${visualizationData ? `VISUALIZATION DATA: ${JSON.stringify(visualizationData)}` : ''}

        RESPONSE RULES:
        1. Use citations from search results to form a well-detailed answer of appropriate length based on the context and query (100-400 words)
        2. Maintain conversation context
        3. Always provide valid JSON format
        4. If visualization data is provided, explain its relevance in visualizationContext
        `;

        try {
            // Generate a response using Gemini
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const genResult = await model.generateContent(systemPrompt);
            const responseText = genResult.response.text();

            // Parse the structured response
            let structuredResponse: { response: string; citations?: Citation[]; visualizationContext?: VisualizationContext };
            try {
                const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '');
                structuredResponse = JSON.parse(cleanedResponse);
            } catch (e) {
                console.error("Error parsing generated response:", e);

                // Fallback: extract citations manually
                const citationRegex = /\[(\d+)\]/g;
                const citationMatches = [...responseText.matchAll(citationRegex)];
                const citationNumbers = [...new Set(citationMatches.map(match => parseInt(match[1])))];

                const citations: Citation[] = citationNumbers.map(num => {
                    const result = searchResults[num - 1]; // Adjust for 0-based index
                    return result ? {
                        number: num,
                        source: result.source || 'Unknown Source',
                        url: result.url || '#'
                    } : {
                        number: num,
                        source: 'Reference not found',
                        url: '#'
                    };
                });

                structuredResponse = {
                    response: responseText,
                    citations,
                    visualizationContext: {
                        type: visualizationType as any, // Allow any visualization type here
                        description: 'Visualization relevant to your query'
                    }
                };
            }

            // Create visualization data object
            let visualizationDataObj: VisualizationData | undefined = undefined;

            if (visualizationData && isValidVisualizationType(visualizationType)) {
                visualizationDataObj = {
                    type: visualizationType,
                    data: visualizationData,
                    status: 'success'
                };
            }

            // Save the assistant's message to the database
            await addMessage({
                id: uuidv4(),
                conversation_id: conversationId,
                content: structuredResponse.response,
                type: 'assistant',
                citations: structuredResponse.citations,
                visualization_data: visualizationDataObj,
                visualization_context: structuredResponse.visualizationContext as any // Use type assertion here
            });

            // Return the response
            return NextResponse.json({
                answer: structuredResponse.response,
                citations: structuredResponse.citations,
                visualizationData: visualizationDataObj,
                visualizationContext: structuredResponse.visualizationContext,
                conversationId
            });

        } catch (error) {
            console.error('Error generating response:', error);
            return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in conversation endpoint:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ messages: Message[] } | { error: string }>> {
    try {
        const paramsData = await params;
        const conversationId = paramsData.id;

        if (!conversationId) {
            return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
        }

        // Get all messages for this conversation
        const messages = await getMessages(conversationId);

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Error fetching conversation:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}