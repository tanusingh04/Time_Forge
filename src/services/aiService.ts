export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function* generateAIResponseStream(
  message: string,
  history: ChatMessage[]
): AsyncGenerator<string, void, unknown> {
  const token = localStorage.getItem("token");
  
  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ message, history })
    });

    if (!response.ok) {
      throw new Error("Failed to connect to AI service");
    }

    if (!response.body) {
      throw new Error("ReadableStream not supported by the browser");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }
  } catch (error: any) {
    console.error("AI stream error:", error);
    throw error;
  }
}
