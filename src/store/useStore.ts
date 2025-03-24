import { create } from "zustand";
import { Message, Branch, Conversation } from "@/types";

interface Store {
  messages: Message[];
  branches: Branch[];
  conversations: Conversation[];
  currentConversationId: string | null;
  currentBranchId: string | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setBranches: (branches: Branch[]) => void;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversationId: (id: string | null) => void;
  setCurrentBranchId: (id: string | null) => void;
}

export const useStore = create<Store>((set) => ({
  messages: [],
  branches: [],
  conversations: [],
  currentConversationId: null,
  currentBranchId: null,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setBranches: (branches) => set({ branches }),
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  setCurrentBranchId: (id) => set({ currentBranchId: id }),
}));
