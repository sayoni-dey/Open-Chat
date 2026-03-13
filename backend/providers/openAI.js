export async function openaiChat(prompt) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  };

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    options
  );

  if (!response.ok) {
    throw new Error("OpenAI request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}