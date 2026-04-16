import { GoogleGenAI } from "@google/genai";

/**
 * Synthesizes a response from the Gemini API using the C++ Kernel's context.
 * 
 * @param systemPrompt The persona definition (AIZA_SUBSTRATE) from the WASM kernel.
 * @param constructedQuery The conversation ledger and current input from the WASM kernel.
 * @returns The raw text response from the AI.
 */
export async function synthesizeResponse(systemPrompt: string, constructedQuery: string): Promise<string> {
    // STRICT SECURITY RULE: API Key Handling
    // In a true Sovereign architecture, this TypeScript file MUST run on a secure backend (e.g., Node.js/Express).
    // If run in the browser (React/Vite), env variables (like VITE_GEMINI_KEY) are exposed to the client.
    // By using `process.env.GEMINI_API_KEY`, we mandate that this bridge executes in a secure server environment
    // where the key is injected at runtime and never reaches the client's browser.
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error("CRITICAL: GEMINI_API_KEY environment variable is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: constructedQuery,
            config: {
                // Inject the C++ Kernel's persona directly into the system instruction
                systemInstruction: systemPrompt,
                temperature: 0.7,
            }
        });

        return response.text || "";
    } catch (error) {
        console.error("Cloud Synthesis Failed:", error);
        throw error;
    }
}
