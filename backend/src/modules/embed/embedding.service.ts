import { GoogleGenAI } from "@google/genai";
import { ApiError } from "../../utils/ApiError.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 3072;

/* Chunks per embedContent request. The API accepts up to 100 texts per call;
   20 keeps each request well inside the request-size limits. */
const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE ?? 20);

/* Pause between batch requests. Gemini's free tier allows ~30K tokens/min
   and one batch is ~8-18K tokens, so at most one batch per 45s keeps any
   60s window safely under the TPM ceiling. Tune via EMBEDDING_DELAY_MS. */
const DELAY_MS = Number(process.env.EMBEDDING_DELAY_MS ?? 45000);

/* A 429 for a per-minute limit (RPM/TPM) clears in seconds and the response
   tells us exactly how long to wait — so we wait and retry. A 429 for the
   daily quota (RPD) reports a ~24h wait; retrying cannot succeed today, so
   those fail fast. */
const MAX_RETRIES = 3;
const MAX_RETRY_WAIT_MS = 120_000;

/* Transient network failures (Wi-Fi blips, DNS hiccups, connect timeouts) are
   worth retrying a couple of times before aborting a multi-minute indexing
   job — unlike 429 daily quota, which no retry can fix. */
const NETWORK_RETRIES = 3;
const NETWORK_RETRY_BASE_MS = 3_000;

const isTransientNetworkError = (error: unknown): boolean => {
    let err: unknown = error;
    let depth = 0;
    while (err && depth < 4) {
        const anyErr = err as any;
        const code = anyErr?.code ?? anyErr?.cause?.code;
        if (
            typeof code === "string" &&
            /^(UND_|ECONN|EPIPE|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EHOSTUNREACH|ENETUNREACH)/.test(code)
        ) {
            return true;
        }
        // undici surfaces network failures as TypeError("fetch failed")
        if (anyErr instanceof TypeError && anyErr?.message === "fetch failed") {
            return true;
        }
        err = anyErr?.cause;
        depth++;
    }
    return false;
};

const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

/* Gemini 429 responses carry a RetryInfo detail with the exact wait time,
   e.g. {"retryDelay": "34s"} or {"seconds": "86399"} for daily exhaustion. */
const extractRetryDelayMs = (error: unknown): number | null => {
    const raw = JSON.stringify(error);

    const isoMatch = raw.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/i);
    if (isoMatch) {
        return Math.ceil(parseFloat(isoMatch[1]) * 1000);
    }

    const secondsMatch = raw.match(/"seconds"\s*:\s*"(\d+)"/);
    if (secondsMatch) {
        return parseInt(secondsMatch[1], 10) * 1000;
    }

    return null;
};

/* Log the quota details Gemini attaches to 429s so it's clear which limit
   was hit (requests per minute, tokens per minute, or requests per day). */
const logQuotaDetails = (error: unknown) => {
    const details = (error as any)?.error?.details ?? (error as any)?.details;

    if (details) {
        const snippet = JSON.stringify(details);
        console.error(
            "Gemini error details:",
            snippet.length > 500 ? snippet.slice(0, 500) + "…" : snippet
        );
    } else {
        // The SDK doesn't always surface the response details as properties;
        // the raw message usually contains the quota violation JSON.
        console.error(
            "Gemini 429 response:",
            String((error as any)?.message ?? error).slice(0, 500)
        );
    }
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
    try {
        const response = await ai.models.embedContent({
            model: MODEL,
            contents: text,
        });

        if (!response.embeddings?.[0]?.values) {
            throw new ApiError(502, "Failed to generate embedding");
        }

        return response.embeddings[0].values;
    } catch (error) {
        if (error instanceof ApiError) throw error;

        console.error(
            "Embedding generation failed:",
            error instanceof Error ? error.message : error
        );
        throw new ApiError(502, "Failed to generate embedding");
    }
};

export const generateEmbeddings = async (
    texts: string[],
    options?: {
        startOffset?: number;
        total?: number;
        onProgress?: (processed: number, total: number) => void;
    }
): Promise<number[][]> => {
    const startOffset = options?.startOffset ?? 0;
    const total = options?.total ?? texts.length;
    const onProgress = options?.onProgress;

    const embeddings: number[][] = [];
    let retries = 0;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const from = startOffset + i + 1;
        const to = startOffset + Math.min(i + BATCH_SIZE, texts.length);

        console.log(`Embedding ${from}-${to} / ${total}`);

        try {
            const response = await ai.models.embedContent({
                model: MODEL,
                contents: batch,
            });

            if (!response.embeddings) {
                throw new Error("No embeddings returned");
            }

            for (const embedding of response.embeddings) {
                if (!embedding.values || embedding.values.length !== EMBEDDING_DIMENSIONS) {
                    throw new Error(
                        `Invalid embedding returned (expected ${EMBEDDING_DIMENSIONS} values, got ${embedding.values?.length ?? "none"})`
                    );
                }

                embeddings.push(embedding.values);
            }

            /* A short batch must return exactly as many vectors as texts. If
               Gemini ever returns fewer, the mismatch would otherwise surface
               later as a cryptic failure at the database save step. */
            if (response.embeddings.length !== batch.length) {
                throw new Error(
                    `Embedding count mismatch (sent ${batch.length}, received ${response.embeddings.length})`
                );
            }

            retries = 0;
            onProgress?.(to, total);
        } catch (error: any) {
            // Transient network failures: the connection to Gemini (or DNS)
            // dropped. A short backoff-and-retry usually recovers without
            // aborting a multi-minute indexing job.
            if (isTransientNetworkError(error) && retries < NETWORK_RETRIES) {
                retries++;
                const waitMs = NETWORK_RETRY_BASE_MS * 2 ** (retries - 1);
                console.error(
                    `Transient network error while embedding. Retrying this batch in ${waitMs / 1000}s (retry ${retries}/${NETWORK_RETRIES}).`
                );
                await sleep(waitMs);
                i -= BATCH_SIZE; // loop increment will restore i
                continue;
            }

            // Quota/rate limits: the response names the violated metric and
            // how long to wait. Short waits (per-minute RPM/TPM limits) are
            // waited out and the same batch retried; daily exhaustion (RPD)
            // is fatal because retrying cannot succeed today.
            if (error?.status === 429) {
                logQuotaDetails(error);

                // TPM/RPM limits reset every minute. If the response exposes
                // its RetryInfo we use that; otherwise waiting one minute is
                // always sufficient for a per-minute limit.
                const waitMs = extractRetryDelayMs(error) ?? 60_000;

                if (waitMs <= MAX_RETRY_WAIT_MS && retries < MAX_RETRIES) {
                    retries++;
                    console.error(
                        `Gemini rate limit hit (per-minute quota). Waiting ${Math.ceil(waitMs / 1000)}s before retrying this batch (retry ${retries}/${MAX_RETRIES}).`
                    );
                    await sleep(waitMs + 1000);
                    i -= BATCH_SIZE; // loop increment will restore i
                    continue;
                }

                console.error(
                    "Gemini daily quota exhausted or retries exhausted. Aborting."
                );
                throw new ApiError(
                    429,
                    "Gemini embedding quota exceeded. Please try again later."
                );
            }

            console.error(
                "Batch embedding failed:",
                String(error?.message ?? error).slice(0, 500),
                error?.status ? `(status ${error.status})` : ""
            );
            throw new ApiError(502, "Failed to generate embeddings");
        }

        // Wait before the next request so consecutive batches stay well
        // under the per-minute quota.
        if (i + BATCH_SIZE < texts.length) {
            await sleep(DELAY_MS);
        }
    }

    return embeddings;
};


