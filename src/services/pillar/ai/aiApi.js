// Secure Client-Side AI API Connector
// Private credentials remain strictly server-side

export async function callPillarAiApi({ prompt, language = "en", route = "/" }) {
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        language,
        route,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.text) {
        return {
          reply: data.text,
          provider: data.provider,
          intent: "ai_public_reply",
        };
      }
    }
  } catch (err) {
    console.warn("Backend AI proxy connection failed:", err.message);
  }

  return null;
}
