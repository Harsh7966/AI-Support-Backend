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


export const generateJson = async (prompt, jsonShape) => {
    const start = Date.now();

    const response = await googleGenAi.interactions.create({
        model: "gemini-3.5-flash-lite",
        input: prompt,
        response_format: { type: "text", mime_type: "application/json", schema: jsonShape },
        generation_config: { temperature: 0, max_output_tokens: 500 },
    });

    console.log("[LLM:json]", {
        inputTokens: response.usage?.total_input_tokens,
        outputTokens: response.usage?.total_output_tokens,
        latencyMs: Date.now() - start,
    });

    return response.output_text;
};
