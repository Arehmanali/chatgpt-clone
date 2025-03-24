"use client";

import { Chat } from "@/components/Chat";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <main className="flex bg-background text-foreground">
        <Chat />
      </main>
    </ProtectedRoute>
  );
}
