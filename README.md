# AI Support Desk — Backend

REST API and real-time server for an AI-powered customer support platform. Customers raise tickets, agents resolve them, and admins manage the whole system. AI features (ticket classification, knowledge-base assistant, suggested replies, similar-ticket search) are built on Google Gemini and a Qdrant vector database.

## Tech Stack

- **Runtime:** Node.js (ES modules), Express 5
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (`jsonwebtoken`) + `bcryptjs`, role-based (`admin`, `agent`, `user`)
- **Real-time:** Socket.IO (ticket chat)
- **AI:** Google Gemini (`@google/genai`) for LLM + embeddings, Qdrant for vector search (RAG)
- **Validation / limits:** Zod, `express-rate-limit`

## Features

- Role-based auth with separate customer, agent and admin APIs
- Ticket lifecycle: create, update, assign, status/priority changes
- Real-time ticket messages over Socket.IO
- AI ticket classification (category, priority, summary) on creation
- Customer AI assistant answering from the knowledge base (RAG)
- Agent tools: ticket summary, suggested reply, similar tickets, ask-assistant
- Admin knowledge base management and re-indexing
- AI usage logging, cost estimates and per-user rate limits (AI Monitoring)
- Dashboards: `/agent/agent-dashboard` and `/user/user-dashboard`
- Health check endpoint

## Project Structure

```
src/
├── config/        AI settings and defaults
├── controller/    Request handlers (admin, agent, customer, auth, ai)
├── middleware/    Auth (role checks) and AI rate limiters
├── routes/        Express routers (auth, admin, agent, customers, ai)
├── Schema/        Mongoose models (User, Ticket, Message, Category, AI logs/settings, Knowledge)
├── service/       Business logic (LLM, embeddings, RAG, vector store, tools, logging)
├── scripts/       CLI scripts (seed KB, classify tickets, evaluate assistant)
├── seed/          Admin seeder
├── eval/          Seed knowledge and test set
├── utils/         DB connection, helpers, AI request context
├── socket.js      Socket.IO setup
└── server.js      App entry point
```

## Getting Started

### Prerequisites

- Node.js 22 or newer (required by the `openai` package; set in `engines`)
- A MongoDB database (local or Atlas)
- A Google Gemini API key
- A Qdrant instance (cloud or local)

### Installation

```bash
npm install
cp .env.example .env     # then fill in the values
```

### Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Yes | Server port (default in example: `5050`) |
| `FRONTEND_URL` | Yes | Frontend origin for CORS and sockets (e.g. `http://localhost:3000`) |
| `CONNECTION_STRING` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random secret used to sign tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime, e.g. `1d` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes (for seeding) | Credentials for the first admin |
| `GoogleGenAI_API_KEY` | Yes | Gemini API key |
| `LLM_MODEL` / `EMBED_MODEL` | No | Override the default Gemini models |
| `QDRANT_URL` / `QDRANT_API_KEY` | Yes | Qdrant endpoint and key |
| `RAG_MIN_SCORE` / `RAG_TOP_K` | No | Retrieval threshold and number of chunks |
| `AI_RATE_LIMIT`, `ASSISTANT_RATE_LIMIT`, `AGENT_AI_RATE_LIMIT`, `ADMIN_AI_RATE_LIMIT` | No | Per-user limits per 15-minute window |
| `MAX_MESSAGE_LENGTH`, `MAX_QUESTION_LENGTH`, `MAX_OUTPUT_TOKENS` | No | Input/output caps |
| `AI_COST_PER_1M_INPUT` / `AI_COST_PER_1M_OUTPUT` | No | USD per 1M tokens, for cost estimates |
| `APP_TIMEZONE` | No | Timezone for monitoring stats (e.g. `Asia/Kolkata`) |

Never commit `.env`.

### First-time Setup

```bash
npm run adminseed      # creates the admin user from ADMIN_EMAIL / ADMIN_PASSWORD
npm run ai:seed-kb     # (optional) loads starter knowledge-base content into Qdrant
```

### Run

```bash
npm run dev            # development with nodemon
npm start              # production
```

The API is served at `http://localhost:<PORT>/api/v1`. Health check: `GET /health`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start with auto-reload |
| `npm start` | Start the server |
| `npm run adminseed` | Create the initial admin account |
| `npm run ai:seed-kb` | Seed the knowledge base |
| `npm run ai:classify` | Run AI classification over existing tickets |
| `npm run ai:eval` | Evaluate the assistant against `src/eval/testSet.json` |

## API Overview

All routes are under `/api/v1`. Protected routes need `Authorization: Bearer <token>`.

**Auth**
- `POST /auth` — login / signup

**Customer** (`/user`, role `user`)
- `GET /profile`, `GET /all-category`
- `POST /create-ticket`, `GET /getall-ticket`, `GET /ticket-detail/:id`, `PATCH /update-ticket/:id`
- `GET /user-dashboard` — stats and recent tickets
- `GET /messages/:ticketId`

**Agent** (`/agent`, role `agent`)
- `GET /profile`, `GET /getall-ticket`, `GET /ticket-detail/:id`, `PATCH /update-ticket/:id`
- `GET /agent-dashboard`, `GET /messages/:ticketId`

**Admin** (`/admin`, role `admin`)
- Customers: `GET /all-customer`, `GET /customer-by-id/:id`, `PATCH /update-customer/:id`
- Agents: `POST /create-agent`, `GET /all-agents`, `GET /agent-details/:id`, `PATCH /update-agent/:id`
- Categories: `POST /create-category`, `GET /all-category`, `GET /category-details/:id`, `PATCH /update-category/:id`
- Tickets: `GET /getall-ticket`, `GET /ticket-detail/:id`, `PATCH /update-ticket/:id`
- AI: `GET /ai-stats`, `GET|PATCH /ai-settings`

**AI** (`/ai`)
- `POST /assistant` — customer knowledge assistant
- `POST /chat`, `POST /ticket-summary/:id`, `GET /generateDraft/:id`, `POST /similar-tickets`, `POST /ask` — agent/admin tools
- `/knowledge` — admin CRUD and `POST /knowledge/reindex`; `POST /index-tickets`

## Notes

- AI endpoints are rate limited per user. Prompts and responses are not stored in logs, only token counts, latency and status.
- Resolved tickets are indexed into the vector store so they can be suggested as similar tickets.
