import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { getAuthUser } from "./authMiddleware.js";

// AI endpoints par limit lagti hai (warna cost bahut badh sakti hai).
// Limit har USER ki alag hoti hai. Isliye ye middleware hamesha login-check ke BAAD lagao.

const getKey = (req, res) => {
    const user = getAuthUser(res);
    return user ? `${user.role}:${user.userId}` : ipKeyGenerator(req.ip);
};

// 15 minute me kitni requests (limit) allowed hain
const makeLimiter = (limit) =>
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit,
        keyGenerator: getKey,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        message: { status: false, msg: "AI request limit exceeded. Please try again later." },
    });

// Limits .env se badal sakte ho, warna ye default
export const AI_LIMIT = Number(process.env.AI_RATE_LIMIT) || 20;                    // ticket classify, chat, agent ask
export const ASSISTANT_LIMIT = Number(process.env.ASSISTANT_RATE_LIMIT) || 30;      // customer assistant
export const AGENT_TOOLS_LIMIT = Number(process.env.AGENT_AI_RATE_LIMIT) || 60;     // agent: summary, draft, similar tickets
export const ADMIN_LIMIT = Number(process.env.ADMIN_AI_RATE_LIMIT) || 30;           // admin: index, knowledge

export const aiLimiter = makeLimiter(AI_LIMIT);
export const assistantLimiter = makeLimiter(ASSISTANT_LIMIT);
export const agentToolsLimiter = makeLimiter(AGENT_TOOLS_LIMIT);
export const adminAiLimiter = makeLimiter(ADMIN_LIMIT);
