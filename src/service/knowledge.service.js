import mongoose from "mongoose";
import KnowledgeDoc from "../Schema/ai/knowledgeSchema.js";
import { embedTexts } from "./embedding.service.js";
import { ensureCollection, upsertPoints, deletePoints, searchSimilar, toPointId, KNOWLEDGE_COLLECTION } from "./vector.service.js";
import { TOP_K, MIN_SCORE } from "../config/aiConfig.js";

// ============================================================
// Stage 10 (ingestion): Admin ka text -> embed -> Qdrant (vector) + MongoDB (asli text)
// Flow: title + content ko ek text banao -> vector -> Qdrant me save -> Mongo me save.
// ============================================================

// Embedding ke liye title bhi saath jodte hain (title me aksar sabse important keywords hote hain)
const textToEmbed = (doc) => `${doc.title}\n${doc.content}`;

const pointFor = (doc, vector) => ({
    id: toPointId(doc._id),
    vector,
    payload: { docId: String(doc._id), title: doc.title, category: doc.category || "general" },
});

export const createKnowledge = async ({ title, content, category, createdBy }) => {
    await ensureCollection(KNOWLEDGE_COLLECTION);
    const _id = new mongoose.Types.ObjectId(); // id pehle bana lete hain taaki Qdrant aur Mongo dono me same rahe
    const doc = { _id, title, content, category: category || "general", createdBy };

    const [vector] = await embedTexts([textToEmbed(doc)], "RETRIEVAL_DOCUMENT");
    await upsertPoints([pointFor(doc, vector)], KNOWLEDGE_COLLECTION);
    try {
        return await KnowledgeDoc.create(doc);
    } catch (err) {
        // Mongo fail hua to Qdrant me akela vector nahi chhodna
        await deletePoints([toPointId(_id)], KNOWLEDGE_COLLECTION).catch(() => {});
        throw err;
    }
};

export const updateKnowledge = async (id, patch) => {
    const doc = await KnowledgeDoc.findById(id);
    if (!doc) return null;
    if (patch.title !== undefined) doc.title = patch.title;
    if (patch.content !== undefined) doc.content = patch.content;
    if (patch.category !== undefined) doc.category = patch.category || "general";

    await ensureCollection(KNOWLEDGE_COLLECTION);
    const [vector] = await embedTexts([textToEmbed(doc)], "RETRIEVAL_DOCUMENT");
    await upsertPoints([pointFor(doc, vector)], KNOWLEDGE_COLLECTION); // same id = purana vector update
    await doc.save();
    return doc;
};

export const deleteKnowledge = async (id) => {
    const doc = await KnowledgeDoc.findById(id);
    if (!doc) return false;
    await ensureCollection(KNOWLEDGE_COLLECTION);
    await deletePoints([toPointId(doc._id)], KNOWLEDGE_COLLECTION); // pehle vector hatao, phir record
    await doc.deleteOne();
    return true;
};

// Saare entries dobara embed karo (embedding model ya dimension badalne ke baad zaruri)
export const reindexAllKnowledge = async () => {
    const docs = await KnowledgeDoc.find({});
    if (docs.length === 0) return 0;
    await ensureCollection(KNOWLEDGE_COLLECTION);
    const BATCH = 50;
    for (let i = 0; i < docs.length; i += BATCH) {
        const batch = docs.slice(i, i + BATCH);
        const vectors = await embedTexts(batch.map(textToEmbed), "RETRIEVAL_DOCUMENT");
        await upsertPoints(batch.map((d, idx) => pointFor(d, vectors[idx])), KNOWLEDGE_COLLECTION);
    }
    return docs.length;
};

// Stage 10 (query): sawaal -> vector -> Qdrant me milte entries -> Mongo se poora text.
// Score threshold se kam wale nahi aate, isliye khaali list ka matlab "knowledge me iska jawab nahi hai".
export const searchKnowledge = async (question, { limit = TOP_K, minScore = MIN_SCORE } = {}) => {
    await ensureCollection(KNOWLEDGE_COLLECTION);
    const [queryVector] = await embedTexts([question], "RETRIEVAL_QUERY");
    const hits = await searchSimilar(queryVector, { limit, scoreThreshold: minScore, name: KNOWLEDGE_COLLECTION });
    if (hits.length === 0) return [];

    const docs = await KnowledgeDoc.find({ _id: { $in: hits.map((h) => h.payload.docId) } });
    const results = [];
    for (const hit of hits) {
        const doc = docs.find((d) => String(d._id) === hit.payload.docId);
        if (!doc) continue; // Mongo se delete ho chuka (purana vector) to chhod do
        results.push({
            docId: String(doc._id),
            title: doc.title,
            category: doc.category,
            content: doc.content,
            score: Number(hit.score.toFixed(3)),
        });
    }
    return results;
};
