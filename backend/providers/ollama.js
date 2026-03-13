export async function ollamaChat(prompt) {
    const res = await fetch ("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body : JSON.stringify({
            model: "phi3", 
            prompt, stream: false
        })
    });
    const data = await res.json();
    return data.response;
}