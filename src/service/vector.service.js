import { QdrantClient } from "@qdrant/js-client-rest";
import { EMBED_DIM } from "./embedding.service.js";

// Stage 8: Vector DB (Qdrant). Vectors yahan store hote hain aur similarity search yahin hoti hai.
// MongoDB me tickets/users ka asli record rehta hai, Qdrant me sirf vectors + thodi si metadata (payload).
const hasPort = !!new URL(process.env.QDRANT_URL).port;
const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    ...(hasPort ? {} : { port: 6333 }),
    timeout: 30000,
});

export const TICKETS_COLLECTION = "tickets";

// Qdrant point id sirf UUID ya number ho sakta hai, Mongo ObjectId (24 hex) nahi.
// ObjectId ko 32 hex tak pad karke UUID bana lete hain. Same ticket = hamesha same id,
// isliye dobara upsert karne par duplicate nahi banta, purana point update ho jaata hai.
export const toPointId = (mongoId) => {
    const h = String(mongoId).padEnd(32, "0");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

// Collection = vectors ka ek group. Size embedding model ki dimension se match honi chahiye (768).
export const ensureCollection = async (name = TICKETS_COLLECTION) => {
    const { exists } = await qdrant.collectionExists(name);
    if (exists) return;
    await qdrant.createCollection(name, { vectors: { size: EMBED_DIM, distance: "Cosine" } });
    // Filter lagane ke liye us field par index chahiye
    await qdrant.createPayloadIndex(name, { field_name: "category", field_schema: "keyword" });
    console.log(`[VECTOR] collection "${name}" created`);
};

// points = [{ id, vector, payload }]
export const upsertPoints = async (points, name = TICKETS_COLLECTION) => {
    await qdrant.upsert(name, { wait: true, points });
};

// Top-K search. scoreThreshold se kam score wale result nahi aate. filter optional (payload par).
export const searchSimilar = async (vector, { limit = 3, scoreThreshold, category, name = TICKETS_COLLECTION } = {}) => {
    const start = Date.now();
    // v1.19 client me search() hata diya gaya, uski jagah query() hai (jawab { points: [...] })
    const { points: results } = await qdrant.query(name, {
        query: vector,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true,
        ...(category ? { filter: { must: [{ key: "category", match: { value: category } }] } } : {}),
    });
    console.log("[VECTOR]", { found: results.length, latencyMs: Date.now() - start });
    return results;
};
