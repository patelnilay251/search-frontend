interface StockData {
    date: string;
    close: number;
    volume: number;
}

interface FinancialOverview {
    Symbol: string;
    Name: string;
    MarketCapitalization: string;
    PERatio: string;
    DividendYield: string;
    EPS: string;
    AnalystTargetPrice: string;
    [key: string]: string;
}

interface FinancialResponse {
    type: 'financial';
    data: {
        overview: FinancialOverview;
        stockData: StockData[];
    } | null;
    status: 'success' | 'error';
    error?: string;
}

const ALPHA_VANTAGE_FUNCTIONS = {
    OVERVIEW: 'OVERVIEW',
    TIME_SERIES_DAILY: 'TIME_SERIES_DAILY',
} as const;

async function fetchCompanyOverview(symbol: string): Promise<FinancialOverview | null> {
    try {
        const response = await fetch(
            `https://www.alphavantage.co/query?function=${ALPHA_VANTAGE_FUNCTIONS.OVERVIEW}&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`
        );
        const data = await response.json();
        if (data['Error Message'] || data['Note']) {
            console.error('Alpha Vantage API error (overview):', data);
            return null;
        }
        return data;
    } catch (error) {
        console.error('Company overview fetch error:', error);
        return null;
    }
}

async function fetchStockData(symbol: string): Promise<any | null> {
    try {

        const encodedSymbol = encodeURIComponent(symbol.trim());
        const url = `https://www.alphavantage.co/query?function=${ALPHA_VANTAGE_FUNCTIONS.TIME_SERIES_DAILY}&symbol=${encodedSymbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;


        const response = await fetch(url);
        const data = await response.json();

        if (data['Error Message'] || data['Note']) {
            console.error('Alpha Vantage API error (stock):', data);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Stock data fetch error:', error);
        return null;
    }
}

function processStockData(rawData: any): StockData[] {
    if (!rawData || !rawData['Time Series (Daily)']) {
        console.error('Invalid stock data received:', rawData);
        return [];
    }

    try {
        const timeSeriesData = rawData['Time Series (Daily)'];
        const dates = Object.keys(timeSeriesData).slice(0, 30);

        return dates.map(date => ({
            date,
            close: parseFloat(timeSeriesData[date]['4. close']),
            volume: parseInt(timeSeriesData[date]['5. volume'])
        }));
    } catch (error) {
        console.error('Error processing stock data:', error);
        return [];
    }
}

export async function fetchFinancialData(companySymbol: string): Promise<FinancialResponse> {
    try {

        const symbol = companySymbol.toUpperCase();


        const [overviewData, stockData] = await Promise.all([
            fetchCompanyOverview(symbol),
            fetchStockData(symbol)
        ]);

        return {
            type: 'financial',
            data: {
                overview: overviewData || {
                    Symbol: '',
                    Name: '',
                    MarketCapitalization: '',
                    PERatio: '',
                    DividendYield: '',
                    EPS: '',
                    AnalystTargetPrice: ''
                },
                stockData: stockData ? processStockData(stockData) : []
            },
            status: 'success'
        };
    } catch (error) {
        console.error('Financial data fetch error:', error);
        return {
            type: 'financial',
            data: null,
            status: 'error',
            error: 'Failed to fetch financial data'
        };
    }
}