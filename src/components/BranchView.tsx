import React, { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import {
  PlusCircle,
  GitBranch,
  MessageSquare,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Conversation, Branch } from "@/types";

export const BranchView: React.FC = () => {
  const {
    branches,
    conversations,
    currentConversationId,
    currentBranchId,
    setBranches,
    setConversations,
    setCurrentBranchId,
    setCurrentConversationId,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");

  // Load user's conversations
  useEffect(() => {
    loadUserConversations();
  }, [branches, conversations]);

  // Load branches when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadBranches();
    } else {
      setBranches([]);
    }
  }, [currentConversationId]);

  const loadUserConversations = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setConversations(conversations || []);

      if (conversations?.length && !currentConversationId) {
        const mostRecent = conversations[0];
        setCurrentConversationId(mostRecent.id);

        const { data: mainBranch } = await supabase
          .from("branches")
          .select("*")
          .eq("conversationId", mostRecent.id)
          .is("parentBranchId", null)
          .single();

        if (mainBranch) {
          setCurrentBranchId(mainBranch.id);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const { data: branchesData, error: branchesError } = await supabase
        .from("branches")
        .select(
          `
          *,
          conversations:conversationId (
            title
          )
        `
        )
        .eq("conversationId", currentConversationId)
        .order("createdAt", { ascending: true });

      if (branchesError) throw branchesError;
      setBranches(branchesData || []);
    } catch (error) {
      console.error("Error loading branches:", error);
    }
  };

  const handleNewChat = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conversation, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          title: "New Chat",
          userId: user.id,
        })
        .select()
        .single();

      if (conversationError) throw conversationError;

      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .insert({
          conversationId: conversation.id,
          parentBranchId: null,
        })
        .select()
        .single();

      if (branchError) throw branchError;

      setConversations([conversation, ...conversations]);
      setCurrentConversationId(conversation.id);
      setCurrentBranchId(branch.id);
      setBranches([{ ...branch }]);
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    setCurrentConversationId(conversationId);

    try {
      const { data: mainBranch } = await supabase
        .from("branches")
        .select("*")
        .eq("conversationId", conversationId)
        .is("parentBranchId", null)
        .single();

      if (mainBranch) {
        setCurrentBranchId(mainBranch.id);
      }
    } catch (error) {
      console.error("Error loading main branch:", error);
    }
  };

  const handleBranchSelect = (branchId: string) => {
    setCurrentBranchId(branchId);
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranchId(branch.id);
    setEditedTitle(branch.title || "New Thread");
  };

  const handleSaveBranchEdit = async (branch: Branch) => {
    try {
      // Update the branch title
      const { error } = await supabase
        .from("branches")
        .update({ title: editedTitle })
        .eq("id", branch.id);

      if (error) throw error;

      // Fetch the updated conversation to ensure we have the latest data
      const { data: updatedConversation, error: fetchError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", branch.conversationId)
        .single();

      if (fetchError) throw fetchError;

      // Update local conversations state
      setConversations(
        conversations.map((conv) =>
          conv.id === branch.conversationId ? updatedConversation : conv
        )
      );

      // Update branches state with the new conversation title
      const updatedBranches = branches.map((b) =>
        b.id === branch.id
          ? { ...b }
          : b.conversationId === branch.conversationId
          ? { ...b }
          : b
      );
      setBranches(updatedBranches);

      // Refresh the conversations list
      await loadUserConversations();
    } catch (error) {
      console.error("Error updating branch:", error);
    } finally {
      setEditingBranchId(null);
      setEditedTitle("");
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!branch.parentBranchId) {
      alert("Cannot delete the main branch");
      return;
    }

    try {
      const { error } = await supabase
        .from("branches")
        .delete()
        .eq("id", branch.id);

      if (error) throw error;

      // Update local state
      const updatedBranches = branches.filter((b) => b.id !== branch.id);
      setBranches(updatedBranches);

      // If the deleted branch was selected, switch to the main branch
      if (branch.id === currentBranchId) {
        const mainBranch = branches.find((b) => !b.parentBranchId);
        if (mainBranch) {
          setCurrentBranchId(mainBranch.id);
        }
      }
    } catch (error) {
      console.error("Error deleting branch:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col text-gray-300 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-gray-300">
      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 bg-primary hover:bg-primary/80 text-white rounded-lg p-3 transition"
        >
          <PlusCircle size={20} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2">
          <h2 className="text-xs uppercase font-semibold text-gray-500 px-2 mb-2">
            Chat History
          </h2>
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <div key={conversation.id}>
                <button
                  onClick={() => handleConversationSelect(conversation.id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition ${
                    conversation.id === currentConversationId
                      ? "bg-gray-700/50 text-white"
                      : "hover:bg-gray-700/30"
                  }`}
                >
                  <MessageSquare size={18} />
                  <span className="truncate text-sm">{conversation.title}</span>
                </button>
                {/* Show branches if this conversation is selected */}
                {conversation.id === currentConversationId && (
                  <div className="ml-4 mt-1 space-y-1">
                    {branches.map((branch) => (
                      <div
                        key={branch.id}
                        className="group flex items-center gap-1"
                      >
                        <button
                          onClick={() => handleBranchSelect(branch.id)}
                          className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-sm transition ${
                            branch.id === currentBranchId
                              ? "bg-gray-700/50 text-white"
                              : "hover:bg-gray-700/30 text-gray-400"
                          }`}
                        >
                          <GitBranch size={14} />
                          {editingBranchId === branch.id ? (
                            <input
                              type="text"
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              className="flex-1 bg-gray-800 px-1 rounded border border-gray-600 focus:border-primary focus:outline-none"
                              autoFocus
                            />
                          ) : (
                            <span className="truncate">
                              {branch.parentBranchId
                                ? `${branch.title}`
                                : "Main Thread"}
                            </span>
                          )}
                        </button>
                        {branch.parentBranchId &&
                          (editingBranchId === branch.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSaveBranchEdit(branch)}
                                className="p-1 hover:text-primary"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingBranchId(null)}
                                className="p-1 hover:text-red-500"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                              <button
                                onClick={() => handleEditBranch(branch)}
                                className="p-1 hover:text-primary"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteBranch(branch)}
                                className="p-1 hover:text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
