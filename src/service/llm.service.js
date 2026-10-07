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


// STAGE 4: generateText jaisa hi hai, bas ek farak:
// hum Gemini ko bolte hain "jawab is JSON shape me hi dena" (response_format).
// Ye function sirf Gemini se baat karta hai. JSON ko check karna iska kaam NAHI hai,
// wo classification.service karta hai. Alag-alag kaam, alag-alag file.
export const generateJson = async (prompt, jsonShape) => {
    const start = Date.now();

    // Yahan koi try/catch nahi: agar Gemini fail hua to error upar caller tak jaaye,
    // taaki caller decide kare ki fallback dena hai.
    const response = await googleGenAi.interactions.create({
        model: "gemini-3.5-flash-lite",
        input: prompt,
        response_format: { type: "text", mime_type: "application/json", schema: jsonShape },
        generation_config: { temperature: 0, max_output_tokens: 500 }, // temperature 0 = same input par lagbhag same jawab
    });

    console.log("[LLM:json]", {
        inputTokens: response.usage?.total_input_tokens,
        outputTokens: response.usage?.total_output_tokens,
        latencyMs: Date.now() - start,
    });

    return response.output_text; // ye abhi sirf TEXT hai (JSON jaisa dikhne wala), object nahi
};
