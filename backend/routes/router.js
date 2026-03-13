import { openaiChat } from "../providers/openAI.js";
import { ollamaChat } from "../providers/ollama.js";
import { isInternetAvailable } from "../utils/internet.js";



export async function hybridChat(prompt) {
    const online = await isInternetAvailable();
    
    if (online) {
        try {
            return await openaiChat(prompt);
        } catch (err) {
            console.warn ("OpenAI failed, falling back to Ollama");
            return await ollamaChat(prompt);
        }
    }
    return await ollamaChat(prompt);
}