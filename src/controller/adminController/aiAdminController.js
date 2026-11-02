import AiLog from "../../Schema/ai/aiLogSchema.js";
import { getAiSettings, updateAiSettings } from "../../service/aiSettings.service.js";
import { countPoints, TICKETS_COLLECTION, KNOWLEDGE_COLLECTION } from "../../service/vector.service.js";
import { EMBED_DIM } from "../../service/embedding.service.js";
import {
    LLM_MODEL, EMBED_MODEL, TOP_K, MIN_SCORE, MAX_QUESTION_LENGTH, MAX_OUTPUT_TOKENS,
    MAX_KNOWLEDGE_CONTENT, COST_PER_1M_INPUT, COST_PER_1M_OUTPUT,
} from "../../config/aiConfig.js";
import { AI_LIMIT, ASSISTANT_LIMIT, AGENT_TOOLS_LIMIT, ADMIN_LIMIT } from "../../middleware/ai_rateLimiter.js";

// Stage 12: Admin AI monitoring (calls, errors, tokens, latency, cost) aur AI settings.

const estimateCost = (inputTokens, outputTokens) => {
    if (!COST_PER_1M_INPUT && !COST_PER_1M_OUTPUT) return null; // rate set nahi hai
    return Number(((inputTokens / 1e6) * COST_PER_1M_INPUT + (outputTokens / 1e6) * COST_PER_1M_OUTPUT).toFixed(4));
};

// Ek group ka hisaab: calls, errors, tokens, avg latency, cost
const formatGroup = (g) => ({
    calls: g.calls,
    errors: g.errors,
    inputTokens: g.inputTokens,
    outputTokens: g.outputTokens,
    avgLatencyMs: Math.round(g.avgLatencyMs || 0),
    estimatedCostUsd: estimateCost(g.inputTokens, g.outputTokens),
});

// GET /admin/ai-stats?days=7
const getStats = async (req, res) => {
    try {
        const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const match = { $match: { createdAt: { $gte: since } } };
        const sums = {
            calls: { $sum: 1 },
            errors: { $sum: { $cond: ["$ok", 0, 1] } },
            inputTokens: { $sum: "$inputTokens" },
            outputTokens: { $sum: "$outputTokens" },
            avgLatencyMs: { $avg: "$latencyMs" },
        };
        const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";

        const [totalRows, byFeature, daily, recentErrors] = await Promise.all([
            AiLog.aggregate([match, { $group: { _id: null, ...sums } }]),
            AiLog.aggregate([match, { $group: { _id: "$feature", ...sums } }, { $sort: { calls: -1 } }]),
            AiLog.aggregate([
                match,
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone } }, ...sums } },
                { $sort: { _id: 1 } },
            ]),
            AiLog.find({ ok: false, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(10).select("feature kind error createdAt"),
        ]);

        const total = totalRows[0] || { calls: 0, errors: 0, inputTokens: 0, outputTokens: 0, avgLatencyMs: 0 };
        const errorRate = total.calls ? Number(((total.errors / total.calls) * 100).toFixed(1)) : 0;

        return res.status(200).json({
            status: true,
            data: {
                days,
                totals: { ...formatGroup(total), errorRate },
                byFeature: byFeature.map((f) => ({ feature: f._id, ...formatGroup(f) })),
                daily: daily.map((d) => ({ date: d._id, calls: d.calls, errors: d.errors })),
                recentErrors,
            },
        });
    } catch (err) {
        console.log("[AI:stats] error:", err.message);
        return res.status(500).json({ status: false, msg: "Could not load AI stats" });
    }
};

// GET /admin/ai-settings  (switches + sirf padhne wali config + vector counts)
const getSettings = async (req, res) => {
    try {
        const [settings, tickets, knowledge] = await Promise.all([
            getAiSettings(),
            countPoints(TICKETS_COLLECTION),
            countPoints(KNOWLEDGE_COLLECTION),
        ]);
        return res.status(200).json({
            status: true,
            data: {
                toggles: {
                    aiEnabled: settings.aiEnabled,
                    classificationEnabled: settings.classificationEnabled,
                    assistantEnabled: settings.assistantEnabled,
                },
                config: {
                    llmModel: LLM_MODEL,
                    embeddingModel: EMBED_MODEL,
                    embeddingDimension: EMBED_DIM,
                    topK: TOP_K,
                    minScore: MIN_SCORE,
                    maxQuestionLength: MAX_QUESTION_LENGTH,
                    maxOutputTokens: MAX_OUTPUT_TOKENS,
                    maxKnowledgeLength: MAX_KNOWLEDGE_CONTENT,
                    costConfigured: Boolean(COST_PER_1M_INPUT || COST_PER_1M_OUTPUT),
                    rateLimitsPer15Min: {
                        ticketAndChat: AI_LIMIT,
                        customerAssistant: ASSISTANT_LIMIT,
                        agentTools: AGENT_TOOLS_LIMIT,
                        adminAi: ADMIN_LIMIT,
                    },
                },
                vectors: { tickets, knowledge }, // null = Qdrant se count nahi mila
            },
        });
    } catch (err) {
        console.log("[AI:settings] error:", err.message);
        return res.status(500).json({ status: false, msg: "Could not load AI settings" });
    }
};

// PATCH /admin/ai-settings  body: { aiEnabled?, classificationEnabled?, assistantEnabled? }
const patchSettings = async (req, res) => {
    try {
        const settings = await updateAiSettings(req.body);
        return res.status(200).json({
            status: true,
            data: {
                aiEnabled: settings.aiEnabled,
                classificationEnabled: settings.classificationEnabled,
                assistantEnabled: settings.assistantEnabled,
            },
            msg: "AI settings updated",
        });
    } catch (err) {
        console.log("[AI:settings] update error:", err.message);
        return res.status(500).json({ status: false, msg: "Could not update AI settings" });
    }
};

export default { getStats, getSettings, patchSettings };
