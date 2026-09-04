# RepoQA

Chat with any GitHub repository. RepoQA clones a repo, chunks and embeds its code with Google Gemini, stores the vectors in PostgreSQL + pgvector, and answers your questions grounded in the actual source code — with file citations and live indexing progress.

## Features

- **Repository indexing** — submit a GitHub URL and the backend clones it, reads the files, chunks them with a sliding window, embeds each chunk, and stores everything in a pgvector-enabled database.
- **Live progress streaming** — indexing runs as a BullMQ background job, with step-by-step progress (clone → load → chunk → embed → done) streamed to the UI over Server-Sent Events.
- **Grounded Q&A (RAG)** — questions are embedded and matched against code chunks via vector similarity; Gemini answers strictly from the retrieved context and refuses to invent files or functions.
- **Conversations** — multi-turn chat per repository with conversation history, deletion, and markdown-rendered answers with exact file/line citations.
- **Authentication** — email/password auth with short-lived JWT access tokens and rotating refresh tokens in httpOnly cookies.

## Tech Stack

**Backend**

- Node.js + Express 5 + TypeScript
- PostgreSQL with [pgvector](https://github.com/pgvector/pgvector) (Drizzle ORM)
- Redis + BullMQ (indexing queue & workers)
- Google Gemini (`@google/genai`) for embeddings (`gemini-embedding-001`) and chat
- JWT auth, Zod validation, SSE progress streaming

**Frontend**

- React 19 + Vite + TypeScript
- Tailwind CSS 4
- Zustand (auth/session state)
- React Router 7, axios (with automatic token-refresh interceptor)
- react-markdown, sonner, lucide-react

## How It Works

```
                 ┌─────────────────────── Indexing (background job) ───────────────────────┐
 GitHub URL ───► │ clone (simple-git) → read files → chunk (sliding window)                │
                 │ → embed (Gemini) → store chunks + vectors in PostgreSQL/pgvector        │
                 └───────────────────────────────┬─────────────────────────────────────────┘
                                                 │ progress events via Redis pub/sub
                                                 ▼
                                             SSE stream ───► UI progress view

 Question ───► embed question (Gemini) ───► nearest-neighbor search (pgvector)
          ───► retrieved chunks + chat history ───► Gemini ───► grounded answer + citations
```

## Project Structure

```
RepoQA/
├── backend/
│   ├── src/
│   │   ├── db/              # Drizzle client & schema (users, repositories, chunks, conversations, messages)
│   │   ├── middleware/      # auth, SSE auth, validation, error handler
│   │   ├── modules/
│   │   │   ├── auth/        # register / login / refresh / logout
│   │   │   ├── repository/  # repo CRUD
│   │   │   ├── loader/      # file reading from cloned repos
│   │   │   ├── chunk/       # sliding-window chunking
│   │   │   ├── embed/       # Gemini embeddings + indexing pipeline
│   │   │   ├── retrieval/   # vector similarity search
│   │   │   ├── chat/        # conversations, messages, LLM answers
│   │   │   └── progress/    # SSE progress streaming
│   │   ├── queue/           # BullMQ connection, indexing queue & worker
│   │   └── utils/           # ApiResponse/ApiError, bcrypt, JWT
│   ├── drizzle/             # generated migrations
│   └── drizzle.config.ts
└── frontend/
    └── src/
        ├── components/      # shared UI components
        ├── features/        # auth, repository, chat, public pages
        ├── layouts/         # public & app layouts
        ├── lib/             # axios instance + interceptors
        └── routes/          # route guards (protected / guest)
```

## Getting Started

### Prerequisites

- **Node.js 20+**
- **PostgreSQL** with the [pgvector extension](https://github.com/pgvector/pgvector#installation) enabled
- **Redis**
- A **Google Gemini API key** — get one from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Clone the repository

```bash
git clone https://github.com/jayeshsolanki6/RepoQA.git
cd RepoQA
```

### 2. Set up the backend

```bash
cd backend
npm install
cp .env.example .env
```

Fill in your `.env`:

| Variable                | Description                                                        |
| ----------------------- | ------------------------------------------------------------------ |
| `PORT`                  | Port the API listens on (default `5000`)                            |
| `DATABASE_URL`          | PostgreSQL connection string (database must have pgvector enabled)  |
| `FRONTEND_URL`          | Allowed CORS origin, e.g. `http://localhost:5173`                   |
| `ACCESS_TOKEN_SECRET`   | Secret for signing 15-minute JWT access tokens                      |
| `REFRESH_TOKEN_SECRET`  | Secret for signing 7-day JWT refresh tokens                         |
| `GEMINI_API_KEY`        | Google Gemini API key                                               |
| `REDIS_URL`             | Redis connection string, e.g. `redis://localhost:6379`              |
| `EMBEDDING_BATCH_SIZE`  | Optional. Chunks per embedding request (default `20`)               |
| `EMBEDDING_DELAY_MS`    | Optional. Pause between batches to respect Gemini rate limits (default `45000`) |

> **Note:** Make sure the `vector` extension is available in your database: `CREATE EXTENSION vector;`

Run the migrations, then start the dev server:

```bash
npm run db:migrate
npm run dev
```

The API is now running at `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

Optionally create a `.env` in the frontend folder:

```env
VITE_API_URL=http://localhost:5000/api
```

(Defaults to `http://localhost:5000/api` if unset.)

```bash
npm run dev
```

Open `http://localhost:5173`, register an account, add a GitHub repository, wait for indexing to finish, and start asking questions.
