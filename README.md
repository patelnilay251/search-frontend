# AI Slop Search

A powerful semantic search application with conversation capabilities, built with Next.js, Supabase, and Google's Gemini API.

## Features

- Advanced semantic search with query decomposition
- Conversation history and state management
- Database persistence with Supabase
- Beautiful UI with Material-UI
- Real-time streaming search results
- Citation tracking and visualization support

## Setup Instructions

### Prerequisites

- Node.js 16+ and npm
- Supabase account (free tier works fine)
- Google API Key and Search Engine ID
- Gemini API Key

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google credentials for API
GOOGLE_API_KEY=your-google-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
GEMINI_API_KEY=your-gemini-api-key

# Auth settings
NEXT_PUBLIC_AUTH_ENABLED=true
```

### Supabase Database Setup

1. Create a new Supabase project
2. Run the SQL migration script in `/supabase/migrations/20230701000000_create_tables.sql`
3. Copy your Supabase URL and anon key to the `.env.local` file

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. Open http://localhost:3000 in your browser

## Project Structure

```
/app
  /api                  # API routes
    /gemini-search      # Search API
    /conversation       # Conversation API
  /components           # UI components
  /lib                  # Shared utilities
    supabase.ts         # Supabase client & helpers
  /store                # State management
  /conversation         # Conversation page
/supabase
  /migrations           # Database migrations
```

## Technology Stack

- **Frontend**: Next.js, React, Material-UI, Framer Motion
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **API**: Google Generative AI (Gemini), Google Custom Search
- **Deployment**: Vercel (recommended)

## Development

To start the development server:

```bash
npm run dev
```

## License

MIT
