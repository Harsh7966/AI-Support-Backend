import { GoogleGenAI } from "@google/genai";

// ============================================================
// Stage 7: Embedding = sentence ko vector (numbers ki list) me badalna.
// Similar meaning wale sentences ke vectors paas paas hote hain.
// ============================================================

// STEP 1: Client banao (API key .env se aati hai)
const ai = new GoogleGenAI({
    apiKey: process.env.GoogleGenAI_API_KEY,
    httpOptions: { timeout: 30000 },
});

// STEP 2: Model aur vector ki length tay karo.
// Hamesha ek hi model + ek hi dimension use karo (Qdrant collection bhi isi size ki banti hai).
const EMBED_MODEL = "gemini-embedding-001";
export const EMBED_DIM = 768;

// STEP 3: Texts ko vectors me badlo.
// taskType: "RETRIEVAL_DOCUMENT" = jo store karna hai (ticket, PDF chunk)
//           "RETRIEVAL_QUERY"    = jo user poochta hai (sawaal)
export const embedTexts = async (texts, taskType = "RETRIEVAL_DOCUMENT") => {
    const response = await ai.models.embedContent({
        model: EMBED_MODEL,
        contents: texts,
        config: { taskType, outputDimensionality: EMBED_DIM },
    });

    // response.embeddings = [{ values: [...] }, ...]  ->  sirf values ki list wapas do
    return response.embeddings.map((e) => e.values);
};

// STEP 4: Do vectors kitne paas hain (1 = bahut similar, 0 = alag).
// Qdrant ye khud karta hai, par samajhne ke liye yahan rakha hai.
export const cosineSimilarity = (a, b) => {
    let dot = 0, lenA = 0, lenB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        lenA += a[i] * a[i];
        lenB += b[i] * b[i];
    }
    return dot / (Math.sqrt(lenA) * Math.sqrt(lenB));
};
