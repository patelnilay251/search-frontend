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
    relevanceScore: number;
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



const customsearch = google.customsearch('v1');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

//#region Helper Functions

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
        result.snippet.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null
    ];

    const validDate = possibleDates.find(
        (date): date is string => date !== null && !isNaN(new Date(date).getTime())
    );
    return validDate || new Date().toISOString();
}

function getRecencyScore(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const daysDifference = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysDifference / 7);
}

function extractDomain(url: string): string {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
}

function calculateRelevanceScore(result: GoogleSearchItem, query: string): number {
    const queryTerms = query.toLowerCase().split(' ');
    const content = `${result.title} ${result.snippet}`.toLowerCase();

    const termMatch =
        queryTerms.filter((term) => content.includes(term)).length / queryTerms.length;
    const titleRelevance =
        queryTerms.filter((term) => result.title.toLowerCase().includes(term)).length /
        queryTerms.length;
    const freshness = getRecencyScore(extractDate(result));

    return termMatch * 0.4 + titleRelevance * 0.4 + freshness * 0.2;
}

//#endregion

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

export async function POST(req: NextRequest): Promise<NextResponse<APIResponse | { error: string }>> {
    try {
        const { query } = (await req.json()) as SearchRequest;

        // Step 1: Enhanced Google Search
        const searchResponse = await customsearch.cse.list({
            auth: process.env.GOOGLE_API_KEY,
            cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
            q: enrichQuery(query),
            num: 10,
            dateRestrict: 'w1',
            sort: 'date:r:20',
        });

        const searchResults: GoogleSearchItem[] = (searchResponse.data as GoogleSearchResponse).items || [];
        const processedResults: ProcessedResult[] = searchResults
            .filter((result) => {
                const relevanceScore = calculateRelevanceScore(result, query);
                return relevanceScore > 0.6;
            })
            .map((result): ProcessedResult => ({
                title: result.title,
                text: cleanText(result.snippet),
                url: result.link,
                publishedDate: extractDate(result),
                source: extractDomain(result.link),
                relevanceScore: calculateRelevanceScore(result, query),
            }))
            .sort((a, b) => {
                const recencyScore = getRecencyScore(a.publishedDate) - getRecencyScore(b.publishedDate);
                const relevanceDiff = b.relevanceScore - a.relevanceScore;
                return (recencyScore + relevanceDiff) / 2;
            })
            .slice(0, 5);

        // Step 2: Enhanced Gemini Prompt
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const systemPrompt = `You are a highly intelligent assistant generating comprehensive summaries from search results.

Your response must be a valid JSON object with the following structure:
{
    "overview": "string containing 2-3 sentence overview",
    "keyFindings": [
        {
            "title": "string - brief title for the finding",
            "description": "string - detailed explanation"
        }
    ],
    "conclusion": "string containing final context/summary",
    "metadata": {
        "sourcesUsed": number,
        "timeframe": "string - date range of sources",
        "queryContext": "string - search query"
    }
}

Context:
- Query: "${query}"
- Time: ${new Date().toISOString()}
- Number of sources: ${processedResults.length}

Guidelines for summary generation:
1. Overview should focus on most recent and relevant information
2. Include 3-4 key findings supported by sources
3. All information must be directly supported by sources
4. Maintain objectivity and clarity
5. Include relevant dates where important
6. Do not deviate from the JSON structure
7. Ensure response is always parseable JSON

Search Results:
${processedResults
                .map((result, index) => {
                    const date = new Date(result.publishedDate).toLocaleDateString();
                    return `${index + 1}. [${date}] [${result.source}]
Title: ${result.title}
Content: ${result.text}`;
                })
                .join('\n\n')}

Remember: Response must be valid JSON with no additional text or formatting outside the JSON structure`;

        const generationResult: GenerationResponse = await model.generateContent(systemPrompt);
        let summaryData = generationResult.response.text();

        // Clean up the JSON string by removing markdown code block markers
        summaryData = summaryData.replace(/```json\s*|\s*```/g, '').trim();

        const data: APIResponse = {
            searchResults: processedResults,
            summaryData,
            originalQuery: query,
        };

        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:3000',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
            },
        });
    } catch (error: unknown) {
        console.error('Error in API:', error);
        return NextResponse.json(
            { error: 'Failed to fetch or process results' },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': 'http://localhost:3000',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Allow-Credentials': 'true',
                },
            }
        );
    }
}