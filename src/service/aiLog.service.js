import mongoose from "mongoose";
import AiLog from "../Schema/ai/aiLogSchema.js";
import { getAiContext } from "../utils/aiContext.js";

// AI call ka log likhta hai. Fire-and-forget: log fail ho jaye to bhi asli kaam nahi rukna chahiye.
export const logAiCall = ({ kind, model, inputTokens = 0, outputTokens = 0, latencyMs = 0, ok = true, error = null }) => {
    try {
        if (mongoose.connection.readyState !== 1) return; // DB connected nahi to log skip
        const ctx = getAiContext();
        AiLog.create({
            feature: ctx.feature || "unknown",
            kind,
            model,
            userId: ctx.userId || null,
            role: ctx.role || null,
            inputTokens: Number(inputTokens) || 0,
            outputTokens: Number(outputTokens) || 0,
            latencyMs,
            ok,
            error: error ? String(error).slice(0, 300) : null,
        }).catch((err) => console.log("[AI:log] save failed:", err.message));
    } catch (err) {
        console.log("[AI:log] error:", err.message);
    }
};
