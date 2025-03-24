import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API with your API key
if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export async function generateAIResponse(
  messages: { role: "user" | "assistant"; content: string }[]
) {
  try {
    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Convert the chat history to Gemini's format
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Start a chat
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    // Get the last message (current user input)
    const lastMessage = messages[messages.length - 1];

    // Generate the response
    const result = await chat.sendMessage(lastMessage.content);
    const response = await result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw error;
  }
}
