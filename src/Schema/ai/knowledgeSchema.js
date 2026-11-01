import mongoose from "mongoose";

// Knowledge base ka ek entry (FAQ / policy / guide). Admin likhta hai, assistant isi se jawab deta hai.
// Asli text yahan (MongoDB) rehta hai, uska vector Qdrant ke "knowledge" collection me (same _id se jura).
// Abhi ek entry = ek chunk (chhote entries). PDF upload + chunking (Stage 9) baad me isi ke aage judega.
const knowledgeSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        content: { type: String, required: true, trim: true, maxlength: 4000 },
        category: { type: String, trim: true, default: "general", maxlength: 50 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true }
);

const KnowledgeDoc = mongoose.model("KnowledgeDoc", knowledgeSchema);
export default KnowledgeDoc;
