# SportsFeed AI

A sports feed application that uses AI to answer natural-language questions about sports using free APIs and open-source LLMs.

## Features

- Natural language Q&A about sports
- Latest sports news from multiple sources
- Match results and fixtures
- Team and player information
- Source-based answers (no hallucinations)
- Confidence indicators for responses

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **AI**: Open-source LLM (Mistral, LLaMA via Ollama)
- **Data Sources**: TheSportsDB, RSS feeds (ESPN, BBC Sport, etc.)

## Prerequisites

- Node.js 18+
- npm or yarn
- [Ollama](https://ollama.ai/) (for local LLM)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Ollama

Install Ollama and pull a model:

```bash
# Install Ollama from https://ollama.ai/
ollama pull mistral
```

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` as needed. Default settings work out of the box with Ollama.

### 4. Build Packages

```bash
npm run build --workspace=@sports-ai/shared
npm run build --workspace=@sports-ai/prompts
```

### 5. Start Development Servers

In separate terminals:

```bash
# Start API server (port 3001)
npm run dev:api

# Start web app (port 3000)
npm run dev:web
```

Visit http://localhost:3000 to use the app.

## Project Structure

```
sport-feed-ai/
├── apps/
│   ├── web/            # Next.js frontend
│   └── api/            # Node.js backend
├── packages/
│   ├── shared/         # Types and utilities
│   └── prompts/        # AI prompts
├── docs/
│   └── ai-spec.md      # Detailed specification
└── package.json
```

## API Endpoints

### POST /api/query

Query the AI with a sports question.

```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the latest football news?"}'
```

### GET /health

Check API health status.

## Environment Variables

| Variable          | Default                  | Description             |
| ----------------- | ------------------------ | ----------------------- |
| PORT              | 3001                     | API server port         |
| LLM_BASE_URL      | http://localhost:11434   | Ollama API URL          |
| LLM_MODEL         | mistral                  | Model to use            |
| SPORTSDB_API_KEY  | 3                        | TheSportsDB API key     |
| CACHE_TTL         | 300                      | Cache TTL in seconds    |
| CORS_ORIGIN       | http://localhost:3000    | Allowed CORS origin     |

## Using Different LLMs

### Mistral 7B (Recommended)

```bash
ollama pull mistral
```

### LLaMA 3 8B

```bash
ollama pull llama3
```

Update `LLM_MODEL` in your `.env` file accordingly.

## License

MIT
