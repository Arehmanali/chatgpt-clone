export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  conversationId: string;
  parentBranchId: string | null;
  title: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  parentId: string | null;
  conversationId: string;
  branchId: string;
  createdAt: string;
}
