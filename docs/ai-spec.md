# SportsFeed AI - Master Specification

## 1. Project Overview

A SportsFeed Application that allows users to ask natural-language questions about sports and receive accurate, up-to-date answers using free sports APIs and an open-source LLM.

### Key Features

- Natural language Q&A
- Latest sports news
- Match results & fixtures
- Team & player info
- Source-based answers (no hallucinations)
- Chat-style UI

## 2. Tech Stack

### Frontend

- **Next.js 14** (React)
- Tailwind CSS
- Custom Chat UI

### Backend

- **Node.js**
- Express
- REST APIs
- RSS parser

### AI / NLP

- **Open-source LLM** (Mistral 7B, LLaMA 3, etc.)
- Served via Ollama, LM Studio, or vLLM

### Sports Data (Free)

- TheSportsDB
- RSS feeds (ESPN, BBC Sport, Sky Sports, The Guardian)

## 3. Architecture

```
User → Next.js UI → Node API → Sports APIs + RSS → Open-source LLM → Clean JSON response → UI
```

### Data Flow

1. User submits a question
2. Backend extracts keywords and intent
3. Backend fetches relevant data from sports APIs and RSS feeds
4. Context is built and sent to LLM
5. LLM generates response using only provided context
6. Response is returned with sources and confidence level

## 4. API Endpoints

### POST /api/query

Main AI query endpoint.

**Request:**

```json
{
  "query": "latest news about Messi"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "answer": "Lionel Messi scored twice for Inter Miami...",
    "sources": ["ESPN", "BBC Sport"],
    "confidence": "high"
  }
}
```

### GET /health

Health check endpoint.

## 5. Confidence Levels

| Condition               | Confidence |
| ----------------------- | ---------- |
| Multiple recent sources | high       |
| Single source           | medium     |
| Old or missing data     | low        |

## 6. Anti-Hallucination Strategy

- Backend **always fetches data first**
- LLM never answers without context
- Empty context → fallback message
- Low temperature (0.3) for factual responses
- Strict system prompt rules

## 7. Success Criteria

- Accurate answers
- No hallucinations
- Fast responses
- Scalable architecture
