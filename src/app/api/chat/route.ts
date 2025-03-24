import { NextResponse } from "next/server";
import { generateAIResponse } from "@/lib/gemini";

// Check if API key is configured
if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
  throw new Error("Missing NEXT_PUBLIC_GEMINI_API_KEY environment variable");
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty messages array" },
        { status: 400 }
      );
    }

    const content = await generateAIResponse(messages);

    if (!content) {
      throw new Error("No response content from Gemini");
    }

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error("Error in chat API route:", error);

    // Handle specific error cases
    if (error?.status === 429) {
      return NextResponse.json(
        {
          error: "API rate limit exceeded. Please try again later.",
          code: "RATE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      );
    }

    // Return more specific error messages
    const errorMessage = error.message || "Failed to generate AI response";
    const statusCode = error.status || 500;

    return NextResponse.json(
      {
        error: errorMessage,
        code: error.code || "UNKNOWN_ERROR",
      },
      { status: statusCode }
    );
  }
}
