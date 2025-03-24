import React, { useState, useRef, useEffect } from "react";
import { Message } from "@/types";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { generateAIResponse } from "@/lib/gemini";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { BranchView } from "./BranchView";

export const Chat: React.FC = () => {
  const {
    messages,
    currentConversationId,
    currentBranchId,
    addMessage,
    setMessages,
  } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentConversationId && currentBranchId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [currentConversationId, currentBranchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversationId", currentConversationId)
        .eq("branchId", currentBranchId)
        .order("createdAt", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatContainer = chatContainerRef.current;
      const messagesEnd = messagesEndRef.current;

      if (chatContainer) {
        const { scrollHeight, clientHeight, scrollTop } = chatContainer;
        const isScrolledToBottom =
          scrollHeight - clientHeight <= scrollTop + 100;

        if (isScrolledToBottom) {
          messagesEnd.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId || !currentBranchId) return;

    setIsLoading(true);
    setError(null);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content,
      role: "user",
      parentId: messages[messages.length - 1]?.id || null,
      createdAt: new Date().toISOString(),
      conversationId: currentConversationId,
      branchId: currentBranchId,
    };

    try {
      // Save user message
      const { error: userError } = await supabase
        .from("messages")
        .insert(userMessage);
      if (userError) throw userError;
      addMessage(userMessage);

      // Force scroll to bottom after user message
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

      // Generate AI response
      const messageHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      messageHistory.push({ role: "user", content });

      const aiResponseContent = await generateAIResponse(messageHistory);

      // Save AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: aiResponseContent,
        role: "assistant",
        parentId: userMessage.id,
        createdAt: new Date().toISOString(),
        conversationId: currentConversationId,
        branchId: currentBranchId,
      };

      const { error: aiError } = await supabase
        .from("messages")
        .insert(aiMessage);
      if (aiError) throw aiError;
      addMessage(aiMessage);

      // Generate a summarized title based on the AI response
      const summarizedTitle =
        content.length > 40 ? `${content.slice(0, 37)}...` : content;

      // Update the conversation title
      const { error: titleError } = await supabase
        .from("conversations")
        .update({ title: summarizedTitle })
        .eq("id", currentConversationId);

      if (titleError) {
        console.error("Error updating conversation title:", titleError);
      }

      // Update the branch title
      const { error: branchTitleError } = await supabase
        .from("branches")
        .update({ title: summarizedTitle })
        .eq("id", currentBranchId);

      if (branchTitleError) {
        console.error("Error updating branch title:", branchTitleError);
      }

      // Force scroll to bottom after AI response
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (error: any) {
      console.error("Error sending message:", error);

      // Handle specific error cases
      if (error.code === "RATE_LIMIT_EXCEEDED") {
        setError(
          "API rate limit exceeded. Please try again in a few moments or check your API quota."
        );
      } else {
        setError(error.message || "Failed to send message");
      }

      // Optionally remove the user message if AI response failed
      if (messages[messages.length - 1]?.id === userMessage.id) {
        setMessages(messages.slice(0, -1));
        await supabase.from("messages").delete().eq("id", userMessage.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex h-[95vh]">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-900 overflow-y-auto border-r border-gray-800">
        <BranchView />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-800">
        {/* Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          {isLoadingMessages ? (
            <div className="flex min-h-screen items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <MessageList messages={messages} isGenerating={isLoading} />
              {error && (
                <div className="p-4 mx-4 my-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-red-500 font-medium mb-1">Error</div>
                  <div className="text-red-400 text-sm">{error}</div>
                  {error.includes("rate limit") && (
                    <a
                      href="https://makersuite.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm hover:underline mt-2 inline-block"
                    >
                      Check Gemini API Key →
                    </a>
                  )}
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 bg-gray-800">
          <div className="max-w-[48rem] mx-auto w-full py-4 px-4">
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
