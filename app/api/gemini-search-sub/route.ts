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

/** STEP 1: Decompose the query into sub-queries **/
async function decomposeQuery(query: string): Promise<string[]> {
    console.log('🎯 Starting query decomposition for:', query);
    const decompositionPrompt = `Decompose the following complex query into a list of clear, 
concise sub-queries for a multi-step search process. Return ONLY a JSON array of strings.
 Be attentive to add any year data month or time frame if required in sub query,
 if it feels like that would help to improve the accuracy.For reference todays date is ${new Date().toLocaleDateString()}
 So calculate required period accordingy to the query
Query: "${query}"`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result: GenerationResponse = await model.generateContent(decompositionPrompt);
        let decompositionText = result.response.text();
        decompositionText = decompositionText.replace(/```json\s*|\s*```/g, '').trim();
        const subQueries = JSON.parse(decompositionText);
        if (Array.isArray(subQueries)) {
            console.log('📝 Decomposed queries:', subQueries);
            return subQueries.map(q => typeof q === 'string' ? q : q.query || String(q));
        } else {
            return [query];
        }
    } catch (error) {
        console.error("❌ Error during query decomposition:", error);
        return [query];
    }
}

/** STEP 2: Perform a search for each sub-query **/
async function performSubQuerySearch(subQuery: string): Promise<GoogleSearchItem[]> {
    console.log('🔍 Performing search for sub-query:', subQuery);
    try {
        const response = await customsearch.cse.list({
            auth: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
            q: subQuery,
            num: 10,
            // Optionally, you can add additional parameters (e.g., sort, date range)
        });
        console.log(`✅ Found ${response.data.items?.length || 0} results for sub-query:`, subQuery);
        return (response.data.items ?? []) as GoogleSearchItem[];
    } catch (error) {
        console.error("❌ Error during sub-query search for:", subQuery, error);
        return [];
    }
}

/** STEP 3: Aggregate and format results from all sub-queries **/
async function getAggregatedSearchResults(query: string): Promise<SearchResult[]> {
    const subQueries = await decomposeQuery(query);
    console.log("Decomposed sub-queries:", subQueries);
    const resultsArrays = await Promise.all(subQueries.map(sq => performSubQuerySearch(sq)));
    const aggregatedItems = resultsArrays.flat();
    console.log("Aggregated search items count:", aggregatedItems.length);

    // Format the aggregated items into your SearchResult interface
    return aggregatedItems.map(item => ({
        title: item.title || 'No title available',
        snippet: item.snippet || 'No snippet available',
        url: item.link || '',
        source: item.link ? new URL(item.link).hostname.replace('www.', '') : 'unknown'
    }));
}

/** STEP 4: Use aggregated results to enrich the query and determine visualization needs **/
async function getRelevantSearchResults(
    query: string,
    summaryData: SummaryData,
    conversationContext: string
): Promise<GetRelevantSearchResultsReturn> {
    console.log('🎯 Starting getRelevantSearchResults with query:', query);
    console.log('📚 Summary Data:', summaryData);
    console.log('💬 Conversation Context:', conversationContext);

    const aggregatedResults = await getAggregatedSearchResults(query);
    console.log(`📊 Got ${aggregatedResults.length} aggregated results`);

    // Create a new prompt that includes the decomposed queries and aggregated search results.
    const enrichedPrompt = `Analyze the following query and provide both search optimization and visualization needs.

Query: "${query}"
Context: "${summaryData.overview}"
Conversation: "${conversationContext}"

Aggregated Search Results:
${aggregatedResults.map((result, index) => `[${index + 1}] ${result.source}: ${result.title}\n${result.snippet}`).join('\n\n')}

Respond in JSON format only:
{
  "enrichedQuery": "optimized search query",
  "visualization": {
      "type": "none" | "geographic" | "financial" | "weather",
      "entities": ["example: AAPL, Paris, Tokyo"],
      "confidence": number,
      "details": {
          "stockSymbol": "AAPL",  
          "location": "Paris"
      }
  }
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result: GenerationResponse = await model.generateContent(enrichedPrompt);
    const analysisText = result.response.text().trim();
    const cleanedText = analysisText.replace(/```json\s*|\s*```/g, '').trim();
    const parsedResult: EnrichedResult = JSON.parse(cleanedText);
    const visualizationData: Visualization = parsedResult.visualization;

    // Optionally fetch additional data based on visualization needs.
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

    // Perform an actual search with the enriched query if needed.
    console.log('🔎 Starting search for enriched query:', parsedResult.enrichedQuery);
    const searchResponse = await customsearch.cse.list({
        auth: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        q: parsedResult.enrichedQuery,
        num: 8,
        sort: 'date:r:20'
    });
    const items = (searchResponse.data.items ?? []) as GoogleSearchItem[];
    const formattedResults: SearchResult[] = items.map((result) => ({
        title: result.title || 'No title available',
        snippet: result.snippet || 'No snippet available',
        url: result.link || '',
        source: result.link ? new URL(result.link).hostname.replace('www.', '') : 'unknown'
    }));

    return {
        results: formattedResults,
        visualizationData: additionalData
    };
}

function getCorsHeaders(): { [header: string]: string } {
    return {
        'Access-Control-Allow-Origin': 'http://localhost:3001',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true'
    };
}

/** STEP 5: Use the aggregated context in your POST handler **/
export async function POST(req: NextRequest): Promise<NextResponse<PostResponseBody | { error: string }>> {
    console.log('📥 Received POST request');
    try {
        const body = (await req.json()) as PostRequestBody;
        console.log('📦 Request body:', {
            message: body.message,
            conversationId: body.conversationId,
            previousMessagesCount: body.previousMessages?.length
        });

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
        console.log(`🔍 Search complete. Found ${searchResults.length} results`);

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const searchContext = searchResults
            .map((result, index) => `[${index + 1}] ${result.source}: ${result.title}\n${result.snippet}`)
            .join('\n\n');

        const systemPrompt = `You are an AI assistant providing detailed, accurate responses. ALWAYS RESPOND WITH VALID JSON FORMAT:

{
  "response": "Your formatted response with citations like [1][2]",
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
1. Use citations from search results to form a well-detailed answer of 300-400 words.
2. Maintain the conversation context.
3. Always provide valid JSON.
4. If visualization data is provided, explain its relevance in visualizationContext.
5. If search results are insufficient, integrate internal training data to generate the best result.`;

        const genResult: GenerationResponse = await model.generateContent(systemPrompt);
        const responseText = genResult.response.text();

        let structuredResponse: { response: string; citations?: Citation[]; visualizationContext?: unknown };
        try {
            const cleanedResponse = responseText.replace(/```json\s*|\s*```/g, '');
            structuredResponse = JSON.parse(cleanedResponse);
        } catch (e) {
            console.error("Error parsing generated response:", e);
            // Fallback: extract citations from the raw response
            const citationMatches = [...responseText.matchAll(/\[(\d+)\]/g)];
            const citations: Citation[] = citationMatches
                .map((match) => {
                    const num = Number(match[1]);
                    const index = num - 1;
                    return searchResults[index]
                        ? { number: num, source: searchResults[index].source, url: searchResults[index].url }
                        : null;
                })
                .filter((citation): citation is Citation => citation !== null);
            structuredResponse = { response: responseText, citations };
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

        return NextResponse.json(
            { messages: [assistantMessage], conversationId },
            { headers: getCorsHeaders() }
        );
    } catch (error: unknown) {
        console.error('❌ Error in POST handler:', error);
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