import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SearchRequest {
    query: string;
}

interface GoogleSearchItem {
    title: string;
    snippet: string;
    link: string;
    pagemap?: {
        metatags?: Array<{
            'article:published_time'?: string;
            date?: string;
        }>;
        newsarticle?: Array<{
            datepublished?: string;
        }>;
    };
}

interface GoogleSearchResponse {
    items?: GoogleSearchItem[];
}

interface ProcessedResult {
    title: string;
    text: string;
    url: string;
    publishedDate: string;
    source: string;
    score: number;
}

interface APIResponse {
    searchResults: ProcessedResult[];
    summaryData: string;
    originalQuery: string;
}

interface GenerationResponse {
    response: {
        text: () => string;
    };
}

// Define an interface for streaming updates
interface StreamUpdate {
    type: 'decomposition' | 'search' | 'processing' | 'complete';
    data: any;
}

const customsearch = google.customsearch('v1');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

function enrichQuery(query: string): string {
    const currentYear = new Date().getFullYear();
    return `${query} ${currentYear}`;
}

function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/[^\w\s.,!?-]/g, '')
        .trim();
}

function extractDate(result: GoogleSearchItem): string {
    const possibleDates: (string | null)[] = [
        result.pagemap?.metatags?.[0]?.['article:published_time'] ?? null,
        result.pagemap?.metatags?.[0]?.['date'] ?? null,
        result.pagemap?.newsarticle?.[0]?.datepublished ?? null,
        result.snippet.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null,
    ];

    const validDate = possibleDates.find(
        (date): date is string => date !== null && !isNaN(new Date(date).getTime())
    );
    return validDate || new Date().toISOString();
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}

async function decomposeQuery(query: string): Promise<string[]> {
    const decompositionPrompt = `Decompose the following complex query into a list of clear, 
    concise sub-queries for a multi-step search process. Return the list in JSON array format.
    Return ONLY an array of strings, not objects.
    Be attentive to add any year data month or time frame if required in sub query,
    if it feels like that would help to improve the accuracy.

    Query: "${query}"`;

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result: GenerationResponse = await model.generateContent(decompositionPrompt);
        let decompositionText = result.response.text();
        decompositionText = decompositionText.replace(/```json\s*|\s*```/g, '').trim();
        const subQueries = JSON.parse(decompositionText);
        if (Array.isArray(subQueries)) {
            return subQueries.map(q => typeof q === 'string' ? q : q.query || String(q));
        } else {
            return [query];
        }
    } catch (error) {
        console.error("Error during query decomposition, using original query. Error:", error);
        return [query];
    }
}

async function performSubQuerySearch(subQuery: string): Promise<GoogleSearchItem[]> {
    try {
        const comprehensiveResponse = await customsearch.cse.list({
            auth: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
            q: String(subQuery),
            num: 10
        });

        const recentResponse = await customsearch.cse.list({
            auth: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
            q: enrichQuery(String(subQuery)),
            num: 10
        });

        const comprehensiveResults: GoogleSearchItem[] =
            (comprehensiveResponse.data as GoogleSearchResponse).items || [];
        const recentResults: GoogleSearchItem[] =
            (recentResponse.data as GoogleSearchResponse).items || [];

        return [...comprehensiveResults, ...recentResults];
    } catch (error) {
        console.error("Error performing sub-query search for:", subQuery, "Error:", error);
        return [];
    }
}

function calculateRelevanceScore(result: ProcessedResult, query: string): number {
    const combinedText = (result.title + ' ' + result.text).toLowerCase();
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    let matchCount = 0;
    for (const term of queryTerms) {
        if (combinedText.includes(term)) {
            matchCount++;
        }
    }
    const textRelevanceScore = queryTerms.length ? matchCount / queryTerms.length : 0;
    const domain = result.source.toLowerCase();
    let urlScore = 0.6;
    const highQualityTLDs = ['.gov', '.edu', '.org'];
    if (highQualityTLDs.some(tld => domain.endsWith(tld))) {
        urlScore = 1.0;
    } else {
        const highQualityDomains = ['reuters.com', 'bloomberg.com', 'nytimes.com', 'wsj.com', 'forbes.com', 'techcrunch.com'];
        if (highQualityDomains.some(d => domain.includes(d))) {
            urlScore = 1.0;
        }
    }
    const finalScore = (0.7 * textRelevanceScore) + (0.3 * urlScore);
    return Number(finalScore.toFixed(2));
}

export async function OPTIONS(): Promise<NextResponse<null>> {
    return NextResponse.json(null, {
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3001',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        },
    });
}

export async function POST(req: NextRequest): Promise<Response> {
    try {
        console.log('🚀 POST request received');
        const { query } = (await req.json()) as SearchRequest;
        console.log('📝 Received query:', query);

        // Create a new ReadableStream for sending incremental updates
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Helper function to send updates
                    const sendUpdate = (update: StreamUpdate) => {
                        controller.enqueue(
                            new TextEncoder().encode(`data: ${JSON.stringify(update)}\n\n`)
                        );
                    };

                    // Step 1: Query Decomposition
                    sendUpdate({
                        type: 'processing',
                        data: { step: 'decomposition', message: 'Decomposing query...' }
                    });

                    console.log('🔄 Starting query decomposition...');
                    const subQueries = await decomposeQuery(query);
                    console.log("Decomposed sub-queries:", subQueries);

                    // Send decomposition results
                    sendUpdate({
                        type: 'decomposition',
                        data: { subQueries }
                    });

                    // Step 2: Perform searches for each sub-query
                    sendUpdate({
                        type: 'processing',
                        data: { step: 'search', message: 'Searching for results...' }
                    });

                    // Process each sub-query sequentially and send results as they come in
                    const allResults: GoogleSearchItem[] = [];
                    for (let i = 0; i < subQueries.length; i++) {
                        const subQuery = subQueries[i];
                        sendUpdate({
                            type: 'processing',
                            data: {
                                step: 'search',
                                message: `Searching for "${subQuery}" (${i + 1}/${subQueries.length})...`
                            }
                        });

                        const subQueryResults = await performSubQuerySearch(subQuery);
                        allResults.push(...subQueryResults);

                        // Process these partial results and send them
                        const partialProcessedResults: ProcessedResult[] = subQueryResults.map((result): ProcessedResult => {
                            const title = result.title;
                            const text = cleanText(result.snippet);
                            const url = result.link;
                            const publishedDate = extractDate(result);
                            const source = extractDomain(result.link);
                            const tempResult: ProcessedResult = { title, text, url, publishedDate, source, score: 0 };
                            return {
                                title,
                                text,
                                url,
                                publishedDate,
                                source,
                                score: calculateRelevanceScore(tempResult, query)
                            };
                        });

                        sendUpdate({
                            type: 'search',
                            data: {
                                subQuery,
                                results: partialProcessedResults,
                                progress: {
                                    current: i + 1,
                                    total: subQueries.length
                                }
                            }
                        });
                    }

                    // Step 3: Process all results together
                    sendUpdate({
                        type: 'processing',
                        data: { step: 'analysis', message: 'Analyzing and summarizing results...' }
                    });

                    console.log('🔍 Completed intermediate searches for all sub-queries');
                    console.log('📊 Total aggregated results:', allResults.length);

                    const processedResults: ProcessedResult[] = allResults.map((result): ProcessedResult => {
                        const title = result.title;
                        const text = cleanText(result.snippet);
                        const url = result.link;
                        const publishedDate = extractDate(result);
                        const source = extractDomain(result.link);
                        const tempResult: ProcessedResult = { title, text, url, publishedDate, source, score: 0 };
                        return {
                            title,
                            text,
                            url,
                            publishedDate,
                            source,
                            score: calculateRelevanceScore(tempResult, query)
                        };
                    });

                    console.log('✨ Processed and filtered results:', processedResults.length);

                    // Step 4: Generate summary with Gemini
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                    const systemPrompt = `You are a highly intelligent assistant generating comprehensive summaries from search results using a multi-step reasoning process.

                    Your response must be a valid JSON object with the following structure:
                    {
                        "overview": "Use citations from search results to form a well-detailed answer of 300 - 400 words while maintaining clarity and completeness. 
                        Do not use * character in output.Don't reveal what is happeing internally or resoning just make overview of results and nothing else",
                        "keyFindings": [
                            {
                                "title": "string - brief title for the finding",
                                "description": "string - detailed explanation"
                            }
                        ],
                        "conclusion": "string containing final context/summary of length one paragraph",
                        "metadata": {
                            "sourcesUsed": number,
                            "timeframe": "string - date range of sources",
                            "queryContext": "string - search query"
                        }
                    }

                    Context:
                    - Original Query: "${query}"
                    - Decomposed Sub-Queries: ${subQueries.join('; ')}
                    - Time: ${new Date().toISOString()}
                    - Number of intermediate sources: ${processedResults.length}

                    Intermediate Search Results:
                    ${processedResults
                            .map((result, index) => {
                                const date = new Date(result.publishedDate).toLocaleDateString();
                                return `${index + 1}. [${date}] [${result.source}]
                    Title: ${result.title}
                    Content: ${result.text}`;
                            })
                            .join('\n\n')}

                    Instructions:
                    
                    3. Combine the findings from all sub-queries into a coherent final answer.
                    4. Ensure the final conclusion 100-200 words reflects the reasoning process without revealing internal chain-of-thought details.
                    1. Overview should focus on most recent and relevant information, without revealing internal chain of thought deatils 
                    2. Include 3-4 key findings supported by sources , key findings should be 100-200 words each
                    3. All information must be directly supported by sources and present the information impartially without bias or opinion
                    4. Maintain objectivity and clarity
                    6. Do not deviate from the JSON structure
                    7. Ensure response is always parseable JSON

                    Remember: Response must be valid JSON with no additional text or formatting outside the JSON structure.`;

                    const generationResult: GenerationResponse = await model.generateContent(systemPrompt);
                    let summaryData = generationResult.response.text();
                    console.log('🤖 Generated summary data successfully');

                    summaryData = summaryData.replace(/```json\s*|\s*```/g, '').trim();

                    // Send the final complete response
                    sendUpdate({
                        type: 'complete',
                        data: {
                            searchResults: processedResults,
                            summaryData,
                            originalQuery: query,
                        }
                    });

                    // Close the stream
                    controller.close();
                } catch (error) {
                    console.error('Stream error:', error);
                    controller.error(error);
                }
            }
        });

        // Return the stream with appropriate headers
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': 'http://localhost:3000',
                'Access-Control-Allow-Credentials': 'true',
            },
        });
    } catch (error: unknown) {
        console.error('❌ Error in API:', error);
        console.log('🔍 Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error)
        });
        return new Response(JSON.stringify({ error: 'Failed to fetch or process results' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'http://localhost:3000',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
        });
    }
}