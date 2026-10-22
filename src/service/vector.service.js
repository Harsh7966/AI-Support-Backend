import { QdrantClient } from "@qdrant/js-client-rest";
import { EMBED_DIM } from "./embedding.service.js";

// ============================================================
// Stage 8: Vector DB (Qdrant) = vectors save karna + similar vectors dhoondhna.
// MongoDB me ticket ka asli record rehta hai, Qdrant me sirf vector + thodi info (payload).
// ============================================================

// STEP 1: Qdrant se connect karo (URL aur key .env se)
// Cloud URL me port na likha ho to 6333 laga dete hain.
const urlHasPort = !!new URL(process.env.QDRANT_URL).port;
const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    ...(urlHasPort ? {} : { port: 6333 }),
    timeout: 30000,
});

// Collection ka naam (tickets ke vectors yahan rahenge)
export const TICKETS_COLLECTION = "tickets";

// STEP 2: Mongo id ko Qdrant id me badlo.
// Qdrant ko UUID chahiye, Mongo id 24 characters ki hoti hai, isliye 32 tak pad karke UUID jaisa bana dete hain.
// Same ticket = hamesha same id, to dobara save karne par duplicate nahi banta, update hota hai.
export const toPointId = (mongoId) => {
    const h = String(mongoId).padEnd(32, "0");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
};

// STEP 3: Collection banao (agar pehle se nahi hai).
// size = vector ki length, distance = doori kaise naapni hai (Cosine)
export const ensureCollection = async (name = TICKETS_COLLECTION) => {
    const { exists } = await qdrant.collectionExists(name);
    if (exists) return;

    await qdrant.createCollection(name, {
        vectors: { size: EMBED_DIM, distance: "Cosine" },
    });
    // category par filter lagana hai, isliye uska index bhi banao
    await qdrant.createPayloadIndex(name, { field_name: "category", field_schema: "keyword" });
};

// STEP 4: Vectors save karo.
// points = [{ id, vector, payload }]
export const upsertPoints = async (points, name = TICKETS_COLLECTION) => {
    await qdrant.upsert(name, { wait: true, points });
};

// STEP 5: Sawaal ke vector ke sabse paas wale vectors dhoondo.
// limit = kitne chahiye, scoreThreshold = isse kam score wale mat do, category = optional filter
export const searchSimilar = async (vector, { limit = 3, scoreThreshold, category, name = TICKETS_COLLECTION } = {}) => {
    const request = {
        query: vector,
        limit,
        score_threshold: scoreThreshold,
        with_payload: true,
    };

    // Agar category di hai to sirf usi category me dhoondo
    if (category) {
        request.filter = { must: [{ key: "category", match: { value: category } }] };
    }

    const { points } = await qdrant.query(name, request);
    return points;
};
