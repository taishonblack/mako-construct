import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Trash2, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOptionalAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  const loadThreads = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 0) setLoading(true); else setLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data } = await supabase
      .from("quinn_threads")
      .select("id, date_key, created_at")
      .order("date_key", { ascending: false })
      .range(from, to);

    if (!data) { setLoading(false); setLoadingMore(false); return; }

    if (data.length < PAGE_SIZE) setHasMore(false);

    // Get message counts in parallel
    const summaries = await Promise.all(
      data.map(async (t) => {
        const { count } = await supabase
          .from("quinn_messages")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", t.id);
        return { ...t, message_count: count || 0 };
      })
    );

    setThreads(prev => append ? [...prev, ...summaries] : summaries);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    if (!auth?.user) { setLoading(false); return; }
    loadThreads(0);
  }, [auth?.user, loadThreads]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    loadThreads(next, true);
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
          {hasMore && (
            <div className="flex justify-center pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
                className="text-xs"
              >
                {loadingMore ? (
                  <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Loading…</>
                ) : (
                  "Load more"
                )}
              </Button>
            </div>
          )}
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
