import React, { useState } from "react";
import { Message } from "@/types";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import {
  UserCircle,
  Bot,
  Edit2,
  CornerUpRight,
  X,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Components } from "react-markdown";
import { generateAIResponse } from "@/lib/gemini";

interface MessageItemProps {
  message: Message;
  isGenerating?: boolean;
  isLastMessage?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isGenerating = false,
  isLastMessage = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const {
    currentConversationId,
    addMessage,
    setCurrentBranchId,
    setBranches,
    branches,
  } = useStore();

  const handleCreateBranch = async () => {
    if (!currentConversationId) return;
    setIsCreatingBranch(true);

    try {
      // Create a new branch
      const { data: newBranch, error: branchError } = await supabase
        .from("branches")
        .insert({
          conversationId: currentConversationId,
          parentBranchId: message.branchId,
          title: "New Thread",
        })
        .select()
        .single();

      if (branchError) throw branchError;

      // Create the edited message in the new branch
      const editedMessage: Partial<Message> = {
        content: editedContent,
        role: "user",
        parentId: message.id,
        conversationId: currentConversationId,
        branchId: newBranch.id,
      };

      const { data: newMessage, error: messageError } = await supabase
        .from("messages")
        .insert(editedMessage)
        .select()
        .single();

      if (messageError) throw messageError;

      // Generate AI response based on the edited message
      const aiResponseContent = await generateAIResponse([
        { role: "user", content: editedContent },
      ]);

      // Save AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: aiResponseContent,
        role: "assistant",
        parentId: newMessage.id,
        createdAt: new Date().toISOString(),
        conversationId: currentConversationId,
        branchId: newBranch.id,
      };

      const { error: aiError } = await supabase
        .from("messages")
        .insert(aiMessage);
      if (aiError) throw aiError;

      const summarizedTitle =
        editedContent.length > 20
          ? `${editedContent.slice(0, 17)}...`
          : editedContent;

      // Update the branch title
      const { error: updateBranchNameError } = await supabase
        .from("branches")
        .update({ title: summarizedTitle })
        .eq("id", newBranch.id);

      if (updateBranchNameError) throw updateBranchNameError;

      // Get the conversation title for the new branch
      const { data: conversation } = await supabase
        .from("conversations")
        .select("title")
        .eq("id", currentConversationId)
        .single();

      // Update local branches state
      const newBranchWithTitle = {
        ...newBranch,
        title: summarizedTitle,
      };

      setBranches([...branches, newBranchWithTitle]);
      setCurrentBranchId(newBranch.id);
      addMessage(newMessage);
      addMessage(aiMessage);
      setIsEditing(false);
    } catch (error) {
      console.error("Error creating branch:", error);
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const isUser = message.role === "user";

  const components: Partial<Components> = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : "";
      const isInline = !match;

      if (!isInline && language) {
        return (
          <div className="relative group rounded-lg overflow-hidden">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => navigator.clipboard.writeText(String(children))}
                className="px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700 text-xs text-gray-300"
              >
                Copy
              </button>
            </div>
            <SyntaxHighlighter
              language={language}
              style={oneDark}
              PreTag="div"
              showLineNumbers={false}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          </div>
        );
      }

      return isInline ? (
        <code
          className="px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-200 text-sm"
          {...props}
        >
          {children}
        </code>
      ) : (
        <pre className="p-4 rounded-lg bg-gray-900/50 overflow-x-auto">
          <code {...props}>{children}</code>
        </pre>
      );
    },
    p({ children, ...props }) {
      return (
        <p className="text-gray-200 leading-7" {...props}>
          {children}
        </p>
      );
    },
    ul({ children, ...props }) {
      return (
        <ul className="list-disc pl-6 text-gray-200 space-y-2" {...props}>
          {children}
        </ul>
      );
    },
    ol({ children, ...props }) {
      return (
        <ol className="list-decimal pl-6 text-gray-200 space-y-2" {...props}>
          {children}
        </ol>
      );
    },
    li({ children, ...props }) {
      return (
        <li className="leading-7" {...props}>
          {children}
        </li>
      );
    },
    h1({ children, ...props }) {
      return (
        <h1 className="text-2xl font-bold text-gray-100 mt-6 mb-4" {...props}>
          {children}
        </h1>
      );
    },
    h2({ children, ...props }) {
      return (
        <h2 className="text-xl font-bold text-gray-100 mt-6 mb-4" {...props}>
          {children}
        </h2>
      );
    },
    h3({ children, ...props }) {
      return (
        <h3 className="text-lg font-bold text-gray-100 mt-6 mb-4" {...props}>
          {children}
        </h3>
      );
    },
    blockquote({ children, ...props }) {
      return (
        <blockquote
          className="border-l-4 border-primary/50 pl-4 italic text-gray-300"
          {...props}
        >
          {children}
        </blockquote>
      );
    },
    a({ children, href, ...props }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
          {...props}
        >
          {children}
        </a>
      );
    },
    table({ children, ...props }) {
      return (
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-700 my-4"
            {...props}
          >
            {children}
          </table>
        </div>
      );
    },
    thead({ children, ...props }) {
      return (
        <thead className="bg-gray-700/50" {...props}>
          {children}
        </thead>
      );
    },
    tbody({ children, ...props }) {
      return (
        <tbody className="divide-y divide-gray-700" {...props}>
          {children}
        </tbody>
      );
    },
    tr({ children, ...props }) {
      return <tr {...props}>{children}</tr>;
    },
    th({ children, ...props }) {
      return (
        <th
          className="px-4 py-3 text-left text-sm font-semibold text-gray-200"
          {...props}
        >
          {children}
        </th>
      );
    },
    td({ children, ...props }) {
      return (
        <td
          className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap"
          {...props}
        >
          {children}
        </td>
      );
    },
  };

  return (
    <div
      className={`py-8 px-4 ${isUser ? "bg-transparent" : "bg-gray-800/50"}`}
    >
      <div className="w-full max-w-[48rem] mx-auto flex gap-4 items-start">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
          {isUser ? (
            <UserCircle className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-4 overflow-x-auto">
          {isEditing ? (
            <div className="space-y-4">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-32 px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-200"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateBranch}
                  disabled={isCreatingBranch}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CornerUpRight className="w-4 h-4" />
                  {isCreatingBranch ? "Editing..." : "Edit"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <ReactMarkdown components={components}>
                {message.content}
              </ReactMarkdown>
              {isLastMessage && isGenerating && (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating response...</span>
                </div>
              )}
              {!isGenerating && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit & Branch
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
