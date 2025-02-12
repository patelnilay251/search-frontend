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

/**
 * STEP A: After the enriched prompt is generated, decompose the enriched query
 * into sub-queries.
 */
async function decomposeQuery(query: string): Promise<string[]> {
    const decompositionPrompt = `Decompose the following complex query into a list of clear, concise sub-queries for a multi-step search process. Return ONLY a JSON array of strings.
    
Query: "${query}"`;
    console.log("----- [Decompose Query] Prompt:", decompositionPrompt);
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result: GenerationResponse = await model.generateContent(decompositionPrompt);
        let decompositionText = result.response.text();
        console.log("----- [Decompose Query] Raw Response:", decompositionText);
        decompositionText = decompositionText.replace(/```json\s*|\s*```/g, '').trim();
        const subQueries = JSON.parse(decompositionText);
        console.log("----- [Decompose Query] Parsed Sub-Queries:", subQueries);
        if (Array.isArray(subQueries)) {
            return subQueries.map(q => typeof q === 'string' ? q : q.query || String(q));
        } else {
            return [query];
        }
    } catch (error) {
        console.error("!! Error during query decomposition:", error);
        return [query];
    }
}

/**
 * STEP B: Perform a search for each sub-query.
 */
async function performSubQuerySearch(subQuery: string): Promise<GoogleSearchItem[]> {
    console.log(`----- [Sub-Query Search] Searching for sub-query: "${subQuery}"`);
    try {
        const response = await customsearch.cse.list({
            auth: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
            q: subQuery,
            num: 5,
        });
        const items = (response.data.items ?? []) as GoogleSearchItem[];
        console.log(`----- [Sub-Query Search] Found ${items.length} items for sub-query: "${subQuery}"`);
        return items;
    } catch (error) {
        console.error("!! Error during sub-query search for:", subQuery, error);
        return [];
    }
}

/**
 * STEP C: Aggregate the results from all sub-queries.
 */
async function getAggregatedSearchResults(query: string): Promise<SearchResult[]> {
    console.log("===== [Aggregation] Start Aggregating Results for Query:", query);
    const subQueries = await decomposeQuery(query);
    console.log("===== [Aggregation] Decomposed sub-queries:", subQueries);
    const resultsArrays = await Promise.all(subQueries.map(sq => performSubQuerySearch(sq)));
    const aggregatedItems = resultsArrays.flat();
    console.log("===== [Aggregation] Total Aggregated Items Count:", aggregatedItems.length);
    const formattedResults: SearchResult[] = aggregatedItems.map(item => ({
        title: item.title || 'No title available',
        snippet: item.snippet || 'No snippet available',
        url: item.link || '',
        source: item.link ? new URL(item.link).hostname.replace('www.', '') : 'unknown'
    }));
    console.log("===== [Aggregation] Formatted Aggregated Results:", formattedResults);
    return formattedResults;
}

/**
 * STEP D: Get relevant search results by first enriching the query, then further
 * decomposing and aggregating search results from the enriched query.
 */
async function getRelevantSearchResults(
    query: string,
    summaryData: SummaryData,
    conversationContext: string
): Promise<GetRelevantSearchResultsReturn> {
    console.log("===== [Enrichment] Starting Enrichment for Original Query:", query);
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
    console.log("----- [Enrichment] Combined Prompt:", combinedPrompt);

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result: GenerationResponse = await model.generateContent(combinedPrompt);
        const analysisText = result.response.text().trim();
        console.log("----- [Enrichment] Raw Enrichment Response:", analysisText);
        const cleanedText = analysisText.replace(/```json\s*\n?/, '').replace(/```/, '').trim();
        const parsedResult: EnrichedResult = JSON.parse(cleanedText);
        console.log("===== [Enrichment] Parsed Enriched Result:", parsedResult);

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
            console.log("===== [Enrichment] Additional Visualization Data Fetched:", additionalData);
        } else {
            console.log("===== [Enrichment] No Additional Visualization Data Fetched");
        }

        console.log('----- [Enrichment] Enriched Query:', parsedResult.enrichedQuery);
        console.log('===== [Aggregation] Starting Aggregated Search for Enriched Query');
        const aggregatedResults = await getAggregatedSearchResults(parsedResult.enrichedQuery);
        console.log("===== [Aggregation] Aggregated Results from Enriched Query:", aggregatedResults);

        return {
            results: aggregatedResults,
            visualizationData: additionalData
        };
    } catch (error: unknown) {
        console.error('!! [Enrichment] Search results error:', error);
        return { results: [], visualizationData: null };
    }
}

function getCorsHeaders(): { [header: string]: string } {
    return {
        'Access-Control-Allow-Origin': 'http://localhost:3001',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
    };
}

export async function POST(req: NextRequest): Promise<NextResponse<PostResponseBody | { error: string }>> {
    console.log("========== [POST Handler] Received POST Request ==========");
    try {
        const body = (await req.json()) as PostRequestBody;
        console.log("---------- [POST Handler] Request Body:", JSON.stringify(body, null, 2));
        const { message, conversationId, summaryData, previousMessages = [] } = body;

        const conversationContext = previousMessages
            .slice(-3)
            .map((msg: Message) => `${msg.type}: ${msg.content}`)
            .join('\n');
        console.log("---------- [POST Handler] Conversation Context:\n", conversationContext);

        console.log("========== [POST Handler] Starting getRelevantSearchResults ==========");
        const { results: searchResults, visualizationData } = await getRelevantSearchResults(
            message,
            summaryData,
            conversationContext
        );
        console.log("========== [POST Handler] Search Results:", JSON.stringify(searchResults, null, 2));
        console.log("========== [POST Handler] Visualization Data:", visualizationData);

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const searchContext = searchResults
            .map((result, index) => `[${index + 1}] ${result.source}: ${result.title}\n${result.snippet}`)
            .join('\n\n');
        console.log("---------- [POST Handler] Search Context:\n", searchContext);

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
        //console.log("---------- [POST Handler] System Prompt:\n", systemPrompt);

        const genResult: GenerationResponse = await model.generateContent(systemPrompt);
        const responseText = genResult.response.text();
        //console.log("---------- [POST Handler] Raw Generated Response:\n", responseText);

        let structuredResponse: { response: string; citations?: Citation[]; visualizationContext?: unknown };
        try {
            const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '');
            structuredResponse = JSON.parse(cleanedResponse);
            //console.log("---------- [POST Handler] Parsed Structured Response:\n", structuredResponse);
        } catch (e) {
            console.error("!! [POST Handler] Error parsing generated response:", e);
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
            structuredResponse = { response: responseText, citations };
            console.log("---------- [POST Handler] Fallback Structured Response:\n", structuredResponse);
        }

        const assistantMessage: AssistantMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: structuredResponse.response,
            citations: structuredResponse.citations?.filter(c => c.number <= searchResults.length),
            visualizationData: visualizationData,
            visualizationContext: structuredResponse.visualizationContext,
            timestamp: new Date().toISOString()
        };
        console.log("========== [POST Handler] Final Assistant Message:\n", assistantMessage);

        console.log("========== [POST Handler] Sending Final Response ==========");
        return NextResponse.json(
            {
                messages: [assistantMessage],
                conversationId
            },
            { headers: getCorsHeaders() }
        );
    } catch (error: unknown) {
        console.error("!! [POST Handler] Error in POST handler:", error);
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