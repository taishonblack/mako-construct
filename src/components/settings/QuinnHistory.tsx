import { useState, useEffect } from "react";
import { MessageSquare, Trash2, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ThreadSummary {
  id: string;
  date_key: string;
  created_at: string;
  message_count: number;
}

interface ThreadMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export default function QuinnHistory() {
  const auth = useOptionalAuth();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  useEffect(() => {
    if (!auth?.user) { setLoading(false); return; }
    loadThreads();
  }, [auth?.user]);

  async function loadThreads() {
    setLoading(true);
    const { data } = await supabase
      .from("quinn_threads")
      .select("id, date_key, created_at")
      .order("date_key", { ascending: false });

    if (!data) { setLoading(false); return; }

    // Get message counts
    const summaries: ThreadSummary[] = [];
    for (const t of data) {
      const { count } = await supabase
        .from("quinn_messages")
        .select("id", { count: "exact", head: true })
        .eq("thread_id", t.id);
      summaries.push({ ...t, message_count: count || 0 });
    }
    setThreads(summaries);
    setLoading(false);
  }

  async function loadMessages(threadId: string) {
    setMsgsLoading(true);
    setSelectedThread(threadId);
    const { data } = await supabase
      .from("quinn_messages")
      .select("id, role, content, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    setMsgsLoading(false);
  }

  async function deleteThread(threadId: string) {
    await supabase.from("quinn_messages").delete().eq("thread_id", threadId);
    await supabase.from("quinn_threads").delete().eq("id", threadId);
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (selectedThread === threadId) {
      setSelectedThread(null);
      setMessages([]);
    }
  }

  if (!auth?.user) {
    return (
      <div className="steel-panel p-6 text-center">
        <p className="text-sm text-muted-foreground">Sign in to view Quinn history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="steel-panel p-6 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading history…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="steel-panel p-6">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">
          Quinn Conversation History
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          View and manage past Quinn conversations. The current week's threads are accessible from the Quinn chat page.
        </p>

        {threads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No conversation history yet</p>
        ) : (
          <div className="space-y-1">
            {threads.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 p-3 rounded cursor-pointer group transition-colors ${
                  selectedThread === t.id
                    ? "bg-secondary border-l-2 border-primary"
                    : "hover:bg-secondary/50"
                }`}
                onClick={() => loadMessages(t.id)}
              >
                <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {format(parseISO(t.date_key), "EEEE, MMM d, yyyy")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t.message_count} message{t.message_count !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Thread detail */}
      {selectedThread && (
        <div className="steel-panel p-6">
          <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">
            Thread Messages
          </h3>
          {msgsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      <p className={`text-[9px] mt-1 ${
                        m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}>
                        {format(parseISO(m.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}
