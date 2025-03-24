import React from "react";
import { Message } from "@/types";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: Message[];
  isGenerating?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isGenerating,
}) => {
  return (
    <div className="w-full max-w-[48rem] mx-auto">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isGenerating={isGenerating}
          isLastMessage={index === messages.length - 1}
        />
      ))}
    </div>
  );
};
