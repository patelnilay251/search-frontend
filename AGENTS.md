## Cursor Cloud specific instructions

This is a **Next.js 15** AI-powered search frontend (`search-frontend`). It is a single-service app with no database, no Docker, and no backend services to self-host.

### Running the app

- `npm run dev` starts the dev server on port 3000 (see `CLAUDE.md` for all commands).
- The app UI is fully functional without API keys — navigation, settings, history all work client-side via Zustand/localStorage.
- Search queries will fail at runtime without the environment variables below, but the UI gracefully shows an error toast.

### Required environment variables (for full search functionality)

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini AI — query decomposition & summarization |
| `GOOGLE_API_KEY` | Google Custom Search API |
| `GOOGLE_SEARCH_ENGINE_ID` | Google Programmable Search Engine ID |

Optional: `ALPHA_VANTAGE_API_KEY` (financial visualizations only).

### Caveats

- No `.env.example` exists in the repo. Create a `.env.local` file at the project root to supply keys.
- The `package-lock.json` lockfile is present — always use `npm install` (not yarn/pnpm).
- Node.js v18+ is required (Next.js 15 minimum). The VM ships with v22.
