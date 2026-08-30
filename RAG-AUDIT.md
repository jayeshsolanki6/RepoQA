# RepoQA — RAG pipeline audit

Read-only analysis, 2026-08-30. **No files were changed.** Every item below is a proposal.

Pipeline as it stands:

```
POST /api/repositories        → validate URL → insert row → enqueue BullMQ job
worker (in the API process)   → clone → load files → chunk → embed (batch 50) → insert
POST /api/repositories/:id/ask → embed question → top-5 cosine → prompt → Gemini → save messages
```

Legend: **B** = bug, **Q** = retrieval quality, **D** = dead code / scope, **P** = performance.

---

## Tier 1 — real bugs

### 1. (B) The chunker collapses to roughly one chunk per line on long-line files

`backend/src/modules/chunk/chunk.slidingWindow.ts:73-74`

```ts
const nextCursor = endLine - OVERLAP_LINES;
cursor = Math.max(nextCursor, cursor + 1);
```

`MAX_CHARS` is 3000 and `OVERLAP_LINES` is 15, so the window is only `3000 / avgLineLength` lines
wide. Once the average line reaches ~200 characters the window is ~15 lines — exactly the overlap —
so `endLine - OVERLAP_LINES` lands back on `cursor`, the `cursor + 1` guard takes over, and the
window advances **one line at a time** for the whole file.

Measured by replaying the real algorithm (`avgLineLen` → chunks produced / content duplication):

| avg line length | chunks | duplication |
| --- | --- | --- |
| 20 chars | 11 | 1.10x |
| 80 chars | 17 | 1.60x |
| 150 chars | 21 | 3.50x |
| 190 chars | 105 | **14.00x** |
| 300 chars | 111 | 9.25x |
| README-style prose, 561 chars/line | 35 | **5.25x** |

This repository's own source averages 40–80 chars per line, so today the overall inflation is only
1.07x and the bug is dormant. It fires on prose `.md` with unwrapped paragraphs, minified or bundled
JS/CSS outside `dist/`, compact single-line JSON, generated SQL, and long-line HTML — all of which
are in `SUPPORTED_EXTENSIONS`. Cost when it fires: 14x the embedding compute, 14x the storage, and a
top-5 result set that is five overlapping windows of one file.

**Proposed fix:** express the overlap as a character budget (~10-15% of `MAX_CHARS`), or clamp it to
a fraction of the window's actual line count: `Math.min(OVERLAP_LINES, Math.floor(windowLines / 4))`.
Then assert forward progress of at least half a window rather than one line.

### 2. (B) A single line longer than `MAX_CHARS` produces an unbounded chunk

`chunk.slidingWindow.ts:33-36` — the inner loop always consumes at least one whole line before
checking the budget, so a one-line file is never split. A 400KB minified bundle becomes **one chunk of
400,000 characters ≈ 100,000 tokens**, against the model's 8192-token window (verified in the cached
`config.json`: `max_position_embeddings: 8192`). It is silently truncated, so 92% of that file's
content is embedded as nothing.

**Proposed fix:** hard-split any line longer than `MAX_CHARS` at the character level, plus a size skip
in the loader (`fileReader.ts:70`) for files over ~512KB and a `*.min.*` / `*.map` exclusion.

### 3. (P) There is not a single index in the database

`backend/drizzle/*.sql` — grepping every migration for `INDEX` returns nothing. Consequences:

- `code_chunks` has **no index on `repositoryId`**, so each question sequentially scans every chunk
  belonging to every user.
- `code_chunks.embedding` has **no vector index**, so every question computes cosine distance over
  every row scanned. This is the entire point of pgvector.
- `messages.conversationId`, `conversations.userId`, `conversations.repositoryId` and
  `repositories.userId` are also unindexed.

Worth knowing: pgvector's HNSW index supports at most 2000 dimensions, so while the column was
`vector(3072)` a vector index was impossible. Migration `0005`'s move to 768 is what unblocks it.

**Proposed fix:** one new migration adding a btree index on `code_chunks.repositoryId`, an HNSW index
on `embedding` with `vector_cosine_ops`, and btree indexes on the three foreign keys above. Ordering
matters — this has to come after 0005 is actually applied.

### 4. (B) Cleanup in the worker's `finally` can mask the real error and fail a successful job

`backend/src/queue/indexing.worker.ts:81-85` — `deleteClonedRepository` runs unguarded in `finally`.
On Windows `fs.rm` on a `.git` directory frequently throws EPERM/EBUSY. If it throws after a
successful index, the job is marked failed even though `"completed"` was already published; if it
throws after a failure, its error *replaces* the original error and the real cause is lost.

Evidence this already happened: `backend/repos/9520e13f-a9a2-4928-8594-1a1aee4ae85c/` is still on
disk (463KB) from a previous run.

**Proposed fix:** wrap the cleanup in its own try/catch and log failures without rethrowing.

### 5. (B) A failed index leaves partial chunks behind, and re-indexing duplicates them

Nothing deletes existing rows for a repository before inserting. A run that dies at batch 30 of 60
leaves 1500 half-indexed chunks, and since the `status` column was dropped there is no way to tell a
partial index from a complete one — retrieval quietly answers from half a repository.

**Proposed fix:** `deleteChunksByRepository(repositoryId)` at the start of `indexingService.index`,
making re-indexing idempotent, and again in the worker's failure path.

### 6. (B) The question is saved before the answer, and the history includes the question

`backend/src/modules/chat/chat.service.ts:27-42` — `saveMessage(user)` runs at line 27,
`getRecentMessages` at line 39. Two consequences:

- If Gemini fails (502) the user message is already committed. The frontend drops its optimistic
  bubble, so the orphan question reappears on reload with no answer under it.
- The history fetched at line 39 now contains the question just saved, so the prompt carries it twice
  — once as the final `USER:` line of `CONVERSATION HISTORY` and once as `CURRENT QUESTION`.

**Proposed fix:** read history first, then retrieve, then generate, then save both messages together.

### 7. (B) `filePath varchar(255)` can abort a whole indexing run

`backend/src/db/schema/chunk.ts:10`. A path longer than 255 characters — routine in monorepos and
nested test fixtures — throws on insert and kills the batch, and therefore the job.
**Proposed fix:** `text()`.

### 8. (B) The dashboard list has no stable order

`backend/src/modules/repository/repository.repository.ts:25-30` — `getRepositoriesByUserId` has no
`ORDER BY`, so Postgres may return rows in any order and the cards reshuffle between visits.
**Proposed fix:** `.orderBy(desc(repositories.createdAt))`.

### 9. (B) Gemini auth works only by accident of import order

`backend/src/index.ts:16` calls `dotenv.config()` *after* the import block at lines 1-14, and ES
module imports are fully evaluated before any statement in the importing module runs.
`backend/src/modules/chat/chat.llm.ts:5` reads `process.env.GEMINI_API_KEY!` at module scope and
never loads dotenv itself. It currently works only because `db/index.ts` happens to call
`dotenv.config()` earlier in the import graph. Reordering one import in `chat.service.ts` silently
turns the API key into `undefined`.

**Proposed fix:** a `src/config/env.ts` that loads dotenv and exports validated values, imported as
the very first line of `index.ts` — or drop dotenv and use `node --env-file`.

### 10. (B) Restore the similarity threshold

`backend/src/modules/retrieval/retrieval.repository.ts:26-31` — the `and(...)` wrapper and
`lt(distance, 0.5)` are commented out (your debug edit), so retrieval returns the five nearest chunks
no matter how unrelated they are. That is also what prompt rule 7 in `chat.llm.ts` is compensating
for. Restore it once 0005 is confirmed applied; 0.5 cosine distance is a reasonable starting cut.

**Still unresolved and upstream of all of this:** confirm the live column type before anything else.

```sql
SELECT atttypmod FROM pg_attribute
WHERE attrelid = 'code_chunks'::regclass AND attname = 'embedding';
-- 772 = vector(768), correct.  3076 = vector(3072), migration 0005 was never applied.
```

---

## Tier 2 — retrieval quality

### 11. (Q) No diversity or dedupe in the top-5

`retrieval.service.ts:25-29`. Combined with item 1, five hits can be five overlapping windows of the
same file — nominally five sources, effectively one, and the UI shows five near-identical source
pills. **Proposed fix:** fetch ~15, cap at 2-3 chunks per file path, keep the best 5-6.

### 12. (Q) Chunks use ~9% of the embedding model's context window

The cached `config.json` confirms `max_position_embeddings: 8192` with ALiBi positions and
`model_max_length: 8192`. `MAX_CHARS = 3000` is roughly 750-1000 tokens. Raising it to ~5000-6000
characters yields fewer, more coherent chunks and proportionally faster indexing. Not maxing it out on
purpose: mean pooling over more text produces a blurrier vector, so very large chunks retrieve worse.

### 13. (Q) The file path is not part of what gets embedded

`embed/indexing.service.ts:54` embeds `chunk.content` alone. A question like "where is the database
connection created" has to match on body text only, with no signal from `db/index.ts`.
**Proposed fix:** embed `filePath` + line range + content, while still storing raw `content` for
display. Cheap, and usually one of the larger wins available.

### 14. (P) Embeddings are generated one at a time

`embed/embedding.service.ts:34-50` loops `for (const text of texts)`. The transformers.js pipeline
accepts an array and batches internally. This is the main indexing speedup available, but the output
tensor shape needs verifying before slicing per-row, so I would treat it as its own change.

### 15. (D) Magic numbers for top-k and history depth

Top-k `5` appears at `retrieval.service.ts:28` and again as the default in
`retrieval.repository.ts:8`; history depth `10` at `chat.service.ts:41` and as the default in
`chat.repository.ts:51`. Two places to edit, easy to get out of sync.

---

## Tier 3 — dead code, duplication, scope

16. (D) `RepositoryFile` is declared twice — `modules/loader/fileReader.ts:4` and
    `modules/chunk/chunk.types.ts:1`. One source of truth.
17. (D) `generateEmbedding` is imported but never used in `embed/indexing.service.ts:3`.
18. (D) `and` and `lt` are unused in `retrieval.repository.ts:1` while the filter stays commented out.
19. (D/P) `queue/redisPubSub.ts:4` — `redisSubscriber` exists only to be `.duplicate()`d in
    `subscribeToProgress`; it is never used as a subscriber itself. That is an extra idle Upstash
    connection for nothing. Separately, every SSE client opens its own Redis connection, so a handful
    of open tabs can exhaust the connection allowance. Also, `redisPublisher` is used for `incr`,
    `rpush`, `expire` and `lrange` — it is the general command connection, not a publisher; the name
    misleads.
20. (D) `chunkService.chunk` (`chunk.service.ts:4-13`) is a wrapper for
    `files.flatMap(createChunks)`.
21. (P) Ownership is checked twice per question: `chat.service.ask` validates the conversation, then
    `retrievalService.search` re-fetches the repository and re-checks the owner. Two extra queries on
    every question.
22. (D) `if (!question.trim())` at `retrieval.service.ts:18` is already guaranteed by `askSchema` and
    `searchSchema`.
23. (D) Log noise in `indexing.worker.ts`: `console.log("Cloning repository...")` at line 35 repeats
    the message published at line 29, and the `on("completed")` / `on("failed")` handlers at lines
    93-104 duplicate what the try/catch already logged.
24. (P) `publishProgress` (`progress.service.ts:18-53`) makes five sequential Redis round-trips —
    `incr`, `rpush`, two `expire`, `publish`. Against Upstash that is meaningful latency inside the
    indexing loop, twice per 50-chunk batch. A single `multi()` collapses it to one round-trip.
25. (D) **`POST /api/repositories/:id/search` is never called by the frontend** —
    `retrieval.route.ts`, the `search` controller and `searchSchema` are unused, along with the mount
    at `index.ts:34`. *Your call:* it is a genuinely useful endpoint for eyeballing retrieval quality,
    so I would keep it until items 1-11 are verified, then delete it.
26. (P) The worker runs inside the API process (`index.ts:14`). transformers.js inference is CPU-bound
    in-process, so indexing a repository starves every HTTP request — including the SSE progress
    stream that is meant to be reporting on it. **Proposed fix:** a `src/worker.ts` entry point and a
    `dev:worker` script; run the two side by side.
27. (D) `chat.llm.ts:74` — the comment says "2s, 4s, 8s" but with `MAX_RETRIES = 3` the delays are
    only 2s and 4s.
28. (P) `git.ts:7` clones full history. `--depth 1 --single-branch` is faster and much smaller; the
    pipeline never reads git history.
29. (B) No duplicate-repository guard in `repositoryService.create` — adding the same URL twice
    creates two rows and indexes the repository twice. A unique constraint on `(userId, githubUrl)`
    or a pre-insert check.
30. (B) `getRecentMessages` (`chat.repository.ts:60`) orders by `createdAt` alone. A user message and
    its answer can share a timestamp, making history order nondeterministic. Tie-break on `id`.
31. (D) `progress.service.ts:8` types `step` as `string`; the frontend keeps its own union in
    `types/api.ts`. A shared union prevents drift.

---

## Not changing without a decision from you

- **Streaming answers.** `chat.llm.ts` uses `generateContent`, so the UI waits behind a spinner for
  the whole answer. `generateContentStream` plus an SSE endpoint would be a large perceived-speed win,
  but it touches the controller, a new route and the frontend chat store. Feature work, not a fix.
- **Prompt injection.** Repository content is interpolated into the prompt verbatim, so a repo
  containing adversarial text can steer the model. Low stakes for a personal tool; worth knowing.
- **Language-aware chunking.** Splitting on function and class boundaries beats a sliding window for
  code, but it needs a parser per language. Fixing items 1, 2 and 12 captures most of the benefit for
  a fraction of the complexity.
- **`repositories.status`.** You had this dropped, and items 5 and 10 keep bumping into the fact that
  nothing records whether an index finished. Worth revisiting eventually, but not silently.
