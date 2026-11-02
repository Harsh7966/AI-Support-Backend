import {GoogleGenAI}  from "@google/genai";
import { logAiCall } from "./aiLog.service.js";
import { LLM_MODEL, MAX_OUTPUT_TOKENS } from "../config/aiConfig.js";

const googleGenAi= new GoogleGenAI({
    apiKey: process.env.GoogleGenAI_API_KEY,
    httpOptions:{timeout: 30000}
})

export const generateText= async(userMessage)=>{
    const start= Date.now();
    try{
        const response= await googleGenAi.interactions.create({
            model: LLM_MODEL,
            input: userMessage,
            generation_config: { max_output_tokens: MAX_OUTPUT_TOKENS },
        })

        const stats = {
            inputTokens: response.usage?.total_input_tokens,
            outputTokens: response.usage?.total_output_tokens,
            latencyMs: Date.now() - start
        };
        console.log("[LLM]", stats);
        logAiCall({ kind: "llm", model: LLM_MODEL, ...stats });

        return response.output_text;
    }catch(err){
        console.log(err);
        logAiCall({ kind: "llm", model: LLM_MODEL, latencyMs: Date.now() - start, ok: false, error: err.message });
    }
}


export const generateJson = async (prompt, jsonShape) => {
    const start = Date.now();

    try {
        const response = await googleGenAi.interactions.create({
            model: LLM_MODEL,
            input: prompt,
            response_format: { type: "text", mime_type: "application/json", schema: jsonShape },
            generation_config: { temperature: 0, max_output_tokens: 500 },
        });

        const stats = {
            inputTokens: response.usage?.total_input_tokens,
            outputTokens: response.usage?.total_output_tokens,
            latencyMs: Date.now() - start,
        };
        console.log("[LLM:json]", stats);
        logAiCall({ kind: "llm", model: LLM_MODEL, ...stats });

        return response.output_text;
    } catch (err) {
        logAiCall({ kind: "llm", model: LLM_MODEL, latencyMs: Date.now() - start, ok: false, error: err.message });
        throw err; // pehle jaisa: caller (classification.service) fallback sambhalta hai
    }
};

// Stage 11 (tool calling): model ko tools ki list dete hain. Model sirf BOLTA hai ki kaunsa tool chahiye (functionCalls),
// tool chalana hamara backend ka kaam hai. Poora response wapas milta hai taaki conversation aage badha sakein.
export const generateWithTools = async ({ systemInstruction, contents, functionDeclarations }) => {
    const start = Date.now();
    try {
        const response = await googleGenAi.models.generateContent({
            model: LLM_MODEL,
            contents,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations }],
                maxOutputTokens: MAX_OUTPUT_TOKENS,
            },
        });

        const stats = {
            inputTokens: response.usageMetadata?.promptTokenCount,
            outputTokens: response.usageMetadata?.candidatesTokenCount,
            latencyMs: Date.now() - start,
        };
        console.log("[LLM:tools]", stats);
        logAiCall({ kind: "llm", model: LLM_MODEL, ...stats });
        return response;
    } catch (err) {
        logAiCall({ kind: "llm", model: LLM_MODEL, latencyMs: Date.now() - start, ok: false, error: err.message });
        throw err;
    }
};
