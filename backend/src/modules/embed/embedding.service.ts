import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

let extractor: FeatureExtractionPipeline | null = null;

const MODEL = "jinaai/jina-embeddings-v2-base-code";

const getExtractor = async () => {
    if (!extractor) {
        console.log("Loading embedding model...");

        extractor = await pipeline(
            "feature-extraction",
            MODEL,
            { dtype: "q8" }
        );

        console.log("Embedding model loaded.");
    }

    return extractor;
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
    const model = await getExtractor();

    const output = await model(text, {
        pooling: "mean",
        normalize: true,
    });

    return Array.from(output.data);
};

export const generateEmbeddings = async (texts: string[]): Promise<number[][]> => {
    const model = await getExtractor();

    const embeddings: number[][] = [];

    for (const text of texts) {
        const output = await model(text, {
            pooling: "mean",
            normalize: true,
        });

        embeddings.push(
            Array.from(output.data)
        );
    }
    return embeddings;
};

