import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut } from "lucide-react";

export const Navigation: React.FC = () => {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      router.push("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="bg-secondary p-4 h-[5vh]">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">ChatGPT Clone</h1>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm">{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 hover:text-primary transition"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
