import mongoose from "mongoose";

// Har AI call ka ek log (LLM ya embedding). Prompt/jawab ka text save nahi karte (privacy), sirf numbers.
const aiLogSchema = new mongoose.Schema(
    {
        feature: { type: String, default: "unknown", index: true }, // jaise: ticket_classify, customer_assistant
        kind: { type: String, enum: ["llm", "embedding"], required: true },
        model: { type: String, default: null },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        role: { type: String, default: null },
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        latencyMs: { type: Number, default: 0 },
        ok: { type: Boolean, default: true },
        error: { type: String, default: null },
    },
    { timestamps: true }
);

// 90 din baad log apne aap delete (collection badhta na rahe)
aiLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const AiLog = mongoose.model("AiLog", aiLogSchema);
export default AiLog;
