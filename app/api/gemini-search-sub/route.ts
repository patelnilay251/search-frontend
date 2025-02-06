import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fetchFinancialData } from '../data-fetchers/financial-data';
import { fetchWeatherData } from '../data-fetchers/weather-data';
import { fetchGeographicData } from '../data-fetchers/geo-data';

interface SummaryData {
    overview: string;
}

interface Message {
    type: string;
    content: string;
}

interface PostRequestBody {
    message: string;
    conversationId: string;
    summaryData: SummaryData;
    previousMessages?: Message[];
}

interface VisualizationDetails {
    stockSymbol?: string;
    location?: string;
}

type VisualizationType = 'none' | 'geographic' | 'financial' | 'weather';

interface Visualization {
    type: VisualizationType;
    entities: string[];
    confidence: number;
    details?: VisualizationDetails;
}

interface EnrichedResult {
    enrichedQuery: string;
    visualization: Visualization;
}

interface GoogleSearchItem {
    title: string;
    snippet: string;
    link: string;
}

export interface SearchResult {
    title: string;
    snippet: string;
    url: string;
    source: string;
}

interface GetRelevantSearchResultsReturn {
    results: SearchResult[];
    visualizationData: unknown | null;
}

interface GenerationResponse {
    response: {
        text: () => string;
    };
}

interface Citation {
    number: number;
    source: string;
    url: string;
}

interface AssistantMessage {
    id: string;
    type: string;
    content: string;
    citations?: Citation[];
    visualizationData: unknown | null;
    visualizationContext?: unknown;
    timestamp: string;
}

interface PostResponseBody {
    messages: AssistantMessage[];
    conversationId: string;
}


const customsearch = google.customsearch('v1');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

async function getRelevantSearchResults(
    query: string,
    summaryData: SummaryData,
    conversationContext: string
): Promise<GetRelevantSearchResultsReturn> {
    try {

        const combinedPrompt = `Analyze the following query and provide both search optimization and visualization needs.

        Query: "${query}"
        Context: "${summaryData.overview}"
        Conversation: "${conversationContext}"

        Respond in JSON format only:
        {
            "enrichedQuery": "optimized search query",
            "visualization": {
                "type": "none" | "geographic" | "financial" | "weather",
                "entities": ["use stock symbol for companies, full name for locations"],
                "confidence": 0-1 score,
                "details": {
                    "stockSymbol": "AAPL",  // Include only for financial type
                    "location": "Paris"      // Include for geographic and weather type
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

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result: GenerationResponse = await model.generateContent(combinedPrompt);
        const analysisText = result.response.text().trim();


        const cleanedText = analysisText.replace(/```json\n?/, '').replace(/```/, '').trim();
        const parsedResult: EnrichedResult = JSON.parse(cleanedText);


        const visualizationData: Visualization = parsedResult.visualization;


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
        console.log('🔎 Starting search for query:', parsedResult.enrichedQuery);

        const searchResponse = await customsearch.cse.list({
            auth: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
            q: parsedResult.enrichedQuery,
            num: 8,
            sort: 'date:r:20'
        });

        const items = (searchResponse.data.items ?? []) as GoogleSearchItem[];
        const formattedResults: SearchResult[] = items.map((result) => ({
            title: result.title ?? 'No title available',
            snippet: result.snippet ?? 'No snippet available',
            url: result.link ?? '',
            source: result.link ? new URL(result.link).hostname.replace('www.', '') : 'unknown'
        }));

        return {
            results: formattedResults,
            visualizationData: additionalData
        };
    } catch (error: unknown) {
        console.error('Search results error:', error);
        return { results: [], visualizationData: null };
    }
}

export async function POST(req: NextRequest): Promise<NextResponse<PostResponseBody | { error: string }>> {
    try {
        const body = (await req.json()) as PostRequestBody;
        const { message, conversationId, summaryData, previousMessages = [] } = body;

        const conversationContext = previousMessages
            .slice(-3)
            .map((msg: Message) => `${msg.type}: ${msg.content}`)
            .join('\n');

        const { results: searchResults, visualizationData } = await getRelevantSearchResults(
            message,
            summaryData,
            conversationContext
        );

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const searchContext = searchResults
            .map((result, index) => `[${index + 1}] ${result.source}: ${result.title}\n${result.snippet}`)
            .join('\n\n');

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
            "type": "geographic|financial|weather|none",
            "description": "Brief description of why this visualization is relevant"
        }
        }

        CONVERSATION CONTEXT:
        Topic Summary: ${summaryData.overview}
        Previous Messages: ${conversationContext}
        CURRENT QUERY: "${message}"
        SEARCH RESULTS: ${searchContext}
        ${visualizationData ? `VISUALIZATION DATA: ${JSON.stringify(visualizationData)}` : ''}

        RESPONSE RULES:
        1. Use citations from search results , to form well detailed answer of 300 - 400 words 
        2. Maintain conversation context
        3. Always valid JSON format
        4. If visualization data is provided, explain its relevance in visualizationContext
        5. If the search results are insufficient or not relevant, 
        integrate both the provided search results and 
        your internal training data to generate the best possible result.`;

        const genResult: GenerationResponse = await model.generateContent(systemPrompt);
        const responseText = genResult.response.text();

        let structuredResponse: { response: string; citations?: Citation[]; visualizationContext?: unknown };

        try {
            const cleanedResponse = responseText.replace(/```json/g, '').replace(/```/g, '');
            structuredResponse = JSON.parse(cleanedResponse);
        } catch (e) {
            console.log(e);
            const citationMatches = [...responseText.matchAll(/\[(\d+)\]/g)];
            const citations: Citation[] = citationMatches
                .map((match) => {
                    const num = Number(match[1]);
                    const index = num - 1;
                    return searchResults[index]
                        ? {
                            number: num,
                            source: searchResults[index].source,
                            url: searchResults[index].url
                        }
                        : null;
                })
                .filter((citation): citation is Citation => citation !== null);

            structuredResponse = {
                response: responseText,
                citations
            };
        }

        const assistantMessage: AssistantMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: structuredResponse.response,
            citations: structuredResponse.citations?.filter((c) => c.number <= searchResults.length),
            visualizationData: visualizationData,
            visualizationContext: structuredResponse.visualizationContext,
            timestamp: new Date().toISOString()
        };

        //console.log(assistantMessage);

        return NextResponse.json(
            {
                messages: [assistantMessage],
                conversationId
            },
            { headers: getCorsHeaders() }
        );
    } catch (error: unknown) {
        console.error('Error in POST handler:', error);
        return NextResponse.json(
            { error: 'Failed to process chat message' },
            { status: 500, headers: getCorsHeaders() }
        );
    }
}

export async function OPTIONS(): Promise<NextResponse<null>> {
    return NextResponse.json(null, {
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true'
        }
    });
}

function getCorsHeaders(): { [header: string]: string } {
    return {
        'Access-Control-Allow-Origin': 'http://localhost:3001',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
    };
}