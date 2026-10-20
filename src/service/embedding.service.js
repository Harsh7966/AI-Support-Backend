import { GoogleGenAI } from "@google/genai";

// Stage 7: Embeddings. Text -> numbers (vector). Similar meaning = vectors paas paas.
// Provider ka code sirf yahin rahega (llm.service.js jaisa), taaki baad me provider badalna aasaan ho.
const ai = new GoogleGenAI({
    apiKey: process.env.GoogleGenAI_API_KEY,
    httpOptions: { timeout: 30000 },
});

const EMBED_MODEL = "gemini-embedding-001";

// Vector ki length. Stage 8 me Qdrant collection isi size ki banegi, isliye ye badalna mat.
export const EMBED_DIM = 768;

// taskType:
//   RETRIEVAL_DOCUMENT -> jo text store/search hoga (tickets, PDF chunks)
//   RETRIEVAL_QUERY    -> user ka sawaal
// Hamesha ek hi model + ek hi dimension use karo, warna scores galat aate hain.
export const embedTexts = async (texts, taskType = "RETRIEVAL_DOCUMENT") => {
    const start = Date.now();
    const response = await ai.models.embedContent({
        model: EMBED_MODEL,
        contents: texts,
        config: { taskType, outputDimensionality: EMBED_DIM },
    });

    console.log("[EMBED]", { count: texts.length, latencyMs: Date.now() - start });
    return response.embeddings.map((e) => e.values);
};

// Do vectors kitne paas hain: 1 ke paas = bahut similar, 0 ke paas = unrelated.
export const cosineSimilarity = (a, b) => {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};
