import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Conversation = { id: string; title: string; updated_at: string };
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "streaming" | "error";
};

export const conversationsKey = (userId: string | undefined) => ["conversations", userId] as const;
export const messagesKey = (id: string) => ["messages", id] as const;

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: conversationsKey(userId),
    enabled: Boolean(userId),
    queryFn: async (): Promise<Conversation[]> => {
      const { data, error } = await supabase
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMessages(conversationId: string, enabled: boolean) {
  return useQuery({
    queryKey: messagesKey(conversationId),
    enabled,
    staleTime: Infinity,
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content")
        .eq("conversation_id", conversationId)
        .order("seq", { ascending: true });
      if (error) throw error;
      return data.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }));
    },
  });
}

export async function createConversation(): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("No session");
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userData.user.id })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) throw error;
}

// Hand-off for the first message typed on the welcome screen.
const pending = new Map<string, string>();
export function setPendingMessage(id: string, text: string) {
  pending.set(id, text);
}
export function takePendingMessage(id: string): string | undefined {
  const v = pending.get(id);
  pending.delete(id);
  return v;
}
