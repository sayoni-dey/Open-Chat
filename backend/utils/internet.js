export async function isInternetAvailable () {
    try {
        const controller = new AbortController();
        const timeout = setTimeout ( ()=> controller.abort(), 2000 );
        
        await fetch ("https://api.openai.com", {
            method: "HEAD",
            signal: controller.signal
        });
        clearTimeout(timeout);
        return true;
    } catch {
        return false;
    }
}