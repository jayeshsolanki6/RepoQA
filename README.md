# RepoQA

Chat with any public GitHub repository. RepoQA clones a repo, breaks its source files into chunks, embeds those chunks into a vector database, and lets you ask natural-language questions about the codebase — answered by an LLM grounded strictly in the retrieved code, with file and line-number citations.

Built as a Retrieval-Augmented Generation (RAG) pipeline purpose-built for source code.

---

## Features

- **Index any public GitHub repo** — paste a URL, RepoQA clones it and processes it in the background.
- **Live indexing progress** — real-time status (cloning → chunking → embedding → saving) streamed to the UI via Server-Sent Events.
- **Chat with the codebase** — ask questions in plain English and get answers grounded in the actual retrieved code, with source citations.
- **Multiple conversations per repo** — start fresh threads and revisit chat history.
- **Auth** — email/password signup and login with JWT access + refresh tokens.

## How it works

```
User submits repo URL
        │
        ▼
Repo verified (git ls-remote) → saved → indexing job queued (BullMQ / Redis)
        │
        ▼
Worker: clone repo (shallow) → load supported source files
        │
        ▼
Chunk files (sliding window, ~3000 chars, 15-line overlap)
        │
        ▼
Embed each chunk (Gemini gemini-embedding-001, 3072-dim) → store in Postgres (pgvector)
        │
        ▼
Progress published over Redis Pub/Sub → streamed to client via SSE
        │
        ▼
User asks a question
        │
        ▼
Question embedded → top-10 similar chunks retrieved (cosine distance)
        │
        ▼
Chunks + conversation history → prompt → Gemini gemini-flash-lite-latest
        │
        ▼
Grounded answer returned, with file/line citations shown in the UI
```

## Tech stack

**Backend**
- Node.js, Express 5, TypeScript
- PostgreSQL with the [pgvector](https://github.com/pgvector/pgvector) extension for vector storage/search
- Drizzle ORM + drizzle-kit for schema and migrations
- BullMQ (Redis-backed) for background indexing jobs
- Redis Pub/Sub + Server-Sent Events for real-time indexing progress
- Google Gemini API (`@google/genai`) for embeddings and chat generation
- `simple-git` for shallow repo cloning
- JWT (access + refresh tokens) with bcrypt password hashing

**Frontend**
- React 19, TypeScript, Vite
- Tailwind CSS 4
- Zustand for state management
- React Router 7
- Axios, react-markdown


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
