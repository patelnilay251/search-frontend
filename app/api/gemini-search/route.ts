import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { createConversation, saveSearchResults, supabase } from '@/app/lib/supabase';

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

// interface APIResponse {
//     searchResults: ProcessedResult[];
//     summaryData: string;
//     originalQuery: string;
// }

interface GenerationResponse {
    response: {
        text: () => string;
    };
}

// Define an interface for streaming updates
interface ProcessingStepData {
    step: 'decomposition' | 'search' | 'analysis';
    message: string;
}

interface DecompositionData {
    subQueries: string[];
}

interface SearchData {
    subQuery: string;
    results: ProcessedResult[];
    progress: {
        current: number;
        total: number;
    };
}

interface CompleteData {
    searchResults: ProcessedResult[];
    summaryData: string;
    originalQuery: string;
    conversationId?: string;
}

type StreamUpdate =
    | { type: 'decomposition'; data: DecompositionData }
    | { type: 'search'; data: SearchData }
    | { type: 'processing'; data: ProcessingStepData }
    | { type: 'complete'; data: CompleteData };

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

        // Create a conversation ID for this search
        const conversationId = uuidv4();

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

                    // Create the conversation in the database with initial data
                    try {
                        await createConversation({
                            id: conversationId,
                            user_id: 'anonymous', // We'll update this with actual user IDs when auth is set up
                            query,
                            summary: '' // This will be updated once we have the final summary
                        });
                    } catch (err) {
                        console.error('Error creating conversation in database:', err);
                        // Continue with the search anyway
                    }

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
                            // Calculate relevance score for this result relative to the query
                            tempResult.score = calculateRelevanceScore(tempResult, query);
                            return tempResult;
                        });

                        // Send partial results
                        sendUpdate({
                            type: 'search',
                            data: {
                                subQuery,
                                results: partialProcessedResults,
                                progress: { current: i + 1, total: subQueries.length }
                            }
                        });
                    }

                    console.log('📊 Total aggregated results:', allResults.length);

                    // Process all results together
                    const processedResults: ProcessedResult[] = allResults.map((result): ProcessedResult => {
                        const title = result.title;
                        const text = cleanText(result.snippet);
                        const url = result.link;
                        const publishedDate = extractDate(result);
                        const source = extractDomain(result.link);
                        const tempResult: ProcessedResult = { title, text, url, publishedDate, source, score: 0 };
                        // Calculate relevance score for this result relative to the query
                        tempResult.score = calculateRelevanceScore(tempResult, query);
                        return tempResult;
                    });

                    // Deduplicate results based on URL
                    const deduplicatedResults: ProcessedResult[] = [];
                    const urls = new Set<string>();
                    for (const result of processedResults) {
                        if (!urls.has(result.url)) {
                            urls.add(result.url);
                            deduplicatedResults.push(result);
                        }
                    }

                    console.log('✨ Processed and filtered results:', processedResults.length);

                    // Save search results to database
                    try {
                        const searchResultsToSave = deduplicatedResults.map(result => ({
                            conversation_id: conversationId,
                            title: result.title,
                            text: result.text,
                            url: result.url,
                            published_date: result.publishedDate,
                            source: result.source,
                            score: result.score
                        }));

                        await saveSearchResults(searchResultsToSave);
                    } catch (err) {
                        console.error('Error saving search results to database:', err);
                        // Continue anyway
                    }

                    // Step 3: Generate Summary
                    sendUpdate({
                        type: 'processing',
                        data: { step: 'analysis', message: 'Analyzing results and generating summary...' }
                    });

                    const topResults = deduplicatedResults
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 15);

                    const summaryPrompt = `
                    Generate a comprehensive summary of the following search results for the query: "${query}"
                    
                    Present the summary in JSON format with the following structure:
                    {
                      "overview": "A concise overview of the main findings and themes across all results",
                      "keyFindings": [
                        {
                          "title": "Short title for the finding",
                          "description": "Detailed description of the key finding"
                        },
                        ...
                      ],
                      "conclusion": "A brief conclusion summarizing the answer to the query",
                      "metadata": {
                        "sourcesUsed": Number of sources referenced,
                        "timeframe": "Relevant timeframe of the information",
                        "queryContext": "Brief context about the query domain"
                      }
                    }
                    
                    Search Results:
                    ${topResults.map((result, i) => `
                    [${i + 1}] ${result.title}
                    URL: ${result.url}
                    Date: ${result.publishedDate}
                    ${result.text}
                    `).join('\n')}
                    `;

                    console.log('🤖 Generating summary with Gemini...');
                    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
                    const summaryResult = await model.generateContent(summaryPrompt);
                    let summaryText = summaryResult.response.text();
                    summaryText = summaryText.replace(/```json\s*|\s*```/g, '').trim();

                    // Update conversation summary in database after generating summary
                    try {
                        await supabase
                            .from('conversations')
                            .update({ summary: summaryText })
                            .eq('id', conversationId);
                    } catch (err) {
                        console.error('Error updating conversation summary in database:', err);
                    }

                    // Send the final complete response with the conversation ID
                    sendUpdate({
                        type: 'complete',
                        data: {
                            searchResults: deduplicatedResults,
                            summaryData: summaryText,
                            originalQuery: query,
                            conversationId: conversationId
                        }
                    });

                    console.log('✅ Search and summary complete!');
                } catch (error) {
                    console.error("Stream processing error:", error);
                    controller.error(error);
                } finally {
                    controller.close();
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
    } catch (error) {
        console.error("Error processing search request:", error);
        return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 });
    }
}