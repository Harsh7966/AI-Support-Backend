// Saari AI settings ek jagah. Badalni ho to sirf yahin (ya .env me) badlo.
export const LLM_MODEL = process.env.LLM_MODEL || "gemini-3.5-flash-lite";
export const EMBED_MODEL = process.env.EMBED_MODEL || "gemini-embedding-001";

// Retrieval: itne chunks/tickets context me bhejte hain, aur isse kam score = relevant nahi
export const TOP_K = Number(process.env.RAG_TOP_K) || 3;
export const MIN_SCORE = Number(process.env.RAG_MIN_SCORE) || 0.6;

// Jawab jab context me na mile
export const NO_ANSWER = "I could not find a relevant answer. Please create a ticket and our team will help you.";

// Caps (cost aur abuse se bachne ke liye)
export const MAX_QUESTION_LENGTH = Number(process.env.MAX_QUESTION_LENGTH) || 500;
export const MAX_KNOWLEDGE_TITLE = 200;
export const MAX_KNOWLEDGE_CONTENT = 4000;
export const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS) || 2048;

// Cost estimate ke liye (USD per 1 million tokens). .env me provider ka rate daalo, warna cost "not set" dikhega.
export const COST_PER_1M_INPUT = Number(process.env.AI_COST_PER_1M_INPUT) || 0;
export const COST_PER_1M_OUTPUT = Number(process.env.AI_COST_PER_1M_OUTPUT) || 0;
