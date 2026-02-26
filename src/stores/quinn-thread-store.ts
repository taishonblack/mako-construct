/**
 * Quinn Thread Store – day-based conversation persistence via Supabase.
 */
import { supabase } from "@/integrations/supabase/client";

export interface QuinnThreadMessage {
  id: string;
  role: "quinn" | "user";
  content: string;
  quickReplies?: string[];
  createdAt: string;
}

export interface QuinnThread {
  id: string;
  userId: string;
  dateKey: string;
  messages: QuinnThreadMessage[];
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getDayOfWeek(dateKey: string): number {
  return new Date(dateKey + "T12:00:00").getDay(); // 0=Sun
}

/** Get the week's date keys (Sun–Sat) containing today */
export function getWeekDateKeys(): string[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - dayOfWeek + i);
    keys.push(d.toISOString().split("T")[0]);
  }
  return keys;
}

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const quinnThreadStore = {
  /** Get or create a thread for a specific date */
  async getOrCreateThread(dateKey?: string): Promise<QuinnThread | null> {
    const key = dateKey || todayKey();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try to find existing thread
    const { data: existing } = await supabase
      .from("quinn_threads" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("date_key", key)
      .single();

    if (existing) {
      const messages = await this.getMessages((existing as any).id);
      return {
        id: (existing as any).id,
        userId: user.id,
        dateKey: key,
        messages,
      };
    }

    // Create new thread
    const { data: created, error } = await supabase
      .from("quinn_threads" as any)
      .insert({ user_id: user.id, date_key: key } as any)
      .select()
      .single();

    if (error || !created) {
      console.error("Failed to create quinn thread:", error);
      return null;
    }

    return {
      id: (created as any).id,
      userId: user.id,
      dateKey: key,
      messages: [],
    };
  },

  /** Get messages for a thread */
  async getMessages(threadId: string): Promise<QuinnThreadMessage[]> {
    const { data, error } = await supabase
      .from("quinn_messages" as any)
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (error) { console.error("Failed to load messages:", error); return []; }
    return (data || []).map((m: any) => ({
      id: m.id,
      role: m.role as "quinn" | "user",
      content: m.content,
      quickReplies: m.quick_replies?.length > 0 ? m.quick_replies : undefined,
      createdAt: m.created_at,
    }));
  },

  /** Add a message to a thread */
  async addMessage(
    threadId: string,
    role: "quinn" | "user",
    content: string,
    quickReplies?: string[]
  ): Promise<QuinnThreadMessage | null> {
    const { data, error } = await supabase
      .from("quinn_messages" as any)
      .insert({
        thread_id: threadId,
        role,
        content,
        quick_replies: quickReplies || [],
      } as any)
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to save message:", error);
      return null;
    }

    return {
      id: (data as any).id,
      role: (data as any).role,
      content: (data as any).content,
      quickReplies: (data as any).quick_replies?.length > 0 ? (data as any).quick_replies : undefined,
      createdAt: (data as any).created_at,
    };
  },

  /** Get threads for the current week */
  async getWeekThreads(): Promise<Record<string, string>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const keys = getWeekDateKeys();
    const { data } = await supabase
      .from("quinn_threads" as any)
      .select("id, date_key")
      .eq("user_id", user.id)
      .in("date_key", keys);

    const map: Record<string, string> = {};
    for (const row of (data || []) as any[]) {
      map[row.date_key] = row.id;
    }
    return map;
  },

  /** Log an admin question */
  async logAdminQuestion(question: string, binderId?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("quinn_admin_queue" as any).insert({
      user_id: user.id,
      binder_id: binderId || null,
      question,
      status: "open",
    } as any);
  },
};
