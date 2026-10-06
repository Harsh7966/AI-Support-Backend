import {GoogleGenAI}  from "@google/genai";

const googleGenAi= new GoogleGenAI({
    apiKey: process.env.GoogleGenAI_API_KEY,
    httpOptions:{timeout: 30000}
})

export const generateText= async(userMessage)=>{
    const start= Date.now();
    try{
        const response= await googleGenAi.interactions.create({
            model: "gemini-3.5-flash-lite",
            input: userMessage
        })

        console.log("[LLM]",{
            inputTokens: response.usage?.total_input_tokens,
            outputTokens: response.usage?.total_output_tokens,
            latencyMs: Date.now() - start
        })
    
        return response.output_text;
    }catch(err){
        console.log(err);
    }
}