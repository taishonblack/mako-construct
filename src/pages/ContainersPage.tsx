import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, X, Filter, Plus } from "lucide-react";
import { format, isToday, isBefore, addDays } from "date-fns";
import { binderStore } from "@/stores/binder-store";
import type { BinderStatus } from "@/stores/binder-store";

type FilterTab = "all" | "today" | "week" | "active" | "completed" | "archived" | "drafts";

function inferReadiness(binder: { openIssues: number }): "ready" | "risk" | "blocked" {
  if (binder.openIssues >= 5) return "blocked";
  if (binder.openIssues >= 1) return "risk";
  return "ready";
}

const readinessDot: Record<string, string> = {
  ready: "bg-emerald-400", risk: "bg-amber-400", blocked: "bg-crimson",
};
const statusColor: Record<string, string> = {
  draft: "text-muted-foreground", active: "text-crimson",
  completed: "text-emerald-400", archived: "text-muted-foreground",
};

export default function ContainersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");

  const allBinders = useMemo(() => binderStore.getAll(), []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const now = new Date();
    const weekEnd = addDays(now, 7);

    return allBinders.filter((b) => {
      const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.partner.toLowerCase().includes(q) || b.venue.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      switch (tab) {
        case "today": return isToday(new Date(b.eventDate));
        case "week": { const d = new Date(b.eventDate); return d >= now && isBefore(d, weekEnd); }
        case "active": return b.status === "active";
        case "completed": return b.status === "completed";
        case "archived": return b.status === "archived";
        case "drafts": return b.status === "draft";
        default: return true;
      }
    });
  }, [search, tab, allBinders]);

  const tabs: { label: string; value: FilterTab; count: number }[] = [
    { label: "All", value: "all", count: allBinders.length },
    { label: "Today", value: "today", count: allBinders.filter((b) => isToday(new Date(b.eventDate))).length },
    { label: "This Week", value: "week", count: allBinders.filter((b) => { const d = new Date(b.eventDate); return d >= new Date() && isBefore(d, addDays(new Date(), 7)); }).length },
    { label: "Active", value: "active", count: allBinders.filter((b) => b.status === "active").length },
    { label: "Completed", value: "completed", count: allBinders.filter((b) => b.status === "completed").length },
    { label: "Archived", value: "archived", count: allBinders.filter((b) => b.status === "archived").length },
    { label: "My Drafts", value: "drafts", count: allBinders.filter((b) => b.status === "draft").length },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">Binders</h1>
          <p className="text-sm text-muted-foreground mt-1">{allBinders.length} binders</p>
        </div>
        <Link to="/binders/new"
          className="flex items-center gap-1.5 px-3 py-2 text-xs tracking-wider uppercase rounded-sm border border-crimson/40 bg-crimson/10 text-crimson hover:bg-crimson/20 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Binder
        </Link>
      </motion.div>

      {/* Search + Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }} className="mb-6 space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search binders…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
                tab === t.value ? "border-crimson bg-crimson/10 text-crimson" : "border-border text-muted-foreground hover:text-foreground"
              }`}>
              {t.label} <span className="font-mono ml-0.5">{t.count}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Binder list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="steel-panel px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No binders match your search.</p>
          </div>
        )}
        {filtered.map((binder, i) => {
          const readiness = inferReadiness(binder);
          return (
            <motion.div key={binder.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.02 }}>
              <Link to={`/binders/${binder.id}`}
                className="steel-panel flex items-center gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors group">
                <div className={`w-2 h-2 rounded-full shrink-0 ${readinessDot[readiness]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{binder.title}</p>
                    {binder.status === "draft" && (
                      <span className="px-1.5 py-0.5 text-[9px] tracking-wider uppercase rounded bg-secondary text-muted-foreground border border-border">Draft</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span>{format(new Date(binder.eventDate), "EEE, MMM d")} · {binder.eventTime || "19:00"}</span>
                    {binder.homeTeam && binder.awayTeam && <span>{binder.awayTeam} @ {binder.homeTeam}</span>}
                    <span>{binder.venue}</span>
                    {binder.controlRoom && <span>CR-{binder.controlRoom}</span>}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{binder.partner}</span>
                <span className={`text-[10px] tracking-wider uppercase shrink-0 ${statusColor[binder.status]}`}>
                  {binder.status}
                </span>
                <span className="text-xs font-mono text-muted-foreground shrink-0">{binder.isoCount} ISOs</span>
                {binder.openIssues > 0 && (
                  <span className="text-[10px] text-crimson shrink-0">{binder.openIssues} issues</span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
