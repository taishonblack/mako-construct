import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Clock, Sparkles, User, Route, CheckSquare, Users, FileText } from "lucide-react";
import { format } from "date-fns";
import { activityStore, type ActivityEntry } from "@/stores/activity-store";

const FILTER_OPTIONS = [
  { key: "all", label: "All", icon: Clock },
  { key: "quinn", label: "Quinn", icon: Sparkles },
  { key: "user", label: "User", icon: User },
  { key: "route", label: "Routes", icon: Route },
  { key: "checklist", label: "Checklist", icon: CheckSquare },
  { key: "staff", label: "Staff", icon: Users },
  { key: "file", label: "Files", icon: FileText },
];

function targetBadge(target: string) {
  const colors: Record<string, string> = {
    binder: "bg-primary/20 text-primary",
    route: "bg-blue-500/20 text-blue-400",
    checklist: "bg-emerald-500/20 text-emerald-400",
    staff: "bg-amber-500/20 text-amber-400",
    file: "bg-violet-500/20 text-violet-400",
    wiki: "bg-cyan-500/20 text-cyan-400",
  };
  return colors[target] || "bg-secondary text-muted-foreground";
}

export function ActivityPanel({ binderId }: { binderId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityStore.getForBinder(binderId, 50).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [binderId]);

  const filtered = entries.filter((e) => {
    if (filter === "all") return true;
    if (filter === "quinn") return e.actor_type === "quinn";
    if (filter === "user") return e.actor_type === "user";
    return e.target === filter;
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.75 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Activity</h2>
      <div className="steel-panel p-5">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-wider uppercase rounded-full border transition-colors ${
                filter === opt.key
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <opt.icon className="w-3 h-3" />
              {opt.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet.</p>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {filtered.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded bg-secondary/30 hover:bg-secondary/60 transition-colors text-left"
                  >
                    {expandedId === entry.id ? (
                      <ChevronDown className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{entry.summary}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {entry.actor_type === "quinn" ? "Quinn" : entry.actor_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {format(new Date(entry.timestamp), "MMM d HH:mm")}
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${targetBadge(entry.target)}`}>
                      {entry.target}
                    </span>
                  </button>

                  <AnimatePresence>
                    {expandedId === entry.id && entry.details && Object.keys(entry.details).length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-6 px-3 py-2 text-xs text-muted-foreground bg-secondary/20 rounded-b border-l-2 border-primary/30">
                          {entry.details.fields_changed && (
                            <div className="space-y-1">
                              {(entry.details.fields_changed as string[]).map((field: string) => (
                                <div key={field} className="flex items-center gap-2">
                                  <span className="text-foreground font-medium">{field}:</span>
                                  <span className="text-red-400 line-through">{String(entry.details.before?.[field] ?? "—")}</span>
                                  <span>→</span>
                                  <span className="text-emerald-400">{String(entry.details.after?.[field] ?? "—")}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {!entry.details.fields_changed && (
                            <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(entry.details, null, 2)}</pre>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.section>
  );
}
