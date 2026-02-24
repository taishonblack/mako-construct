import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, X, Plus, SlidersHorizontal } from "lucide-react";
import { format, isToday, isBefore, addDays, isAfter, parseISO } from "date-fns";
import { binderStore } from "@/stores/binder-store";
import type { BinderStatus } from "@/stores/binder-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "today" | "week" | "active" | "completed" | "archived" | "drafts";

function inferReadiness(binder: { openIssues: number }): "ready" | "risk" | "blocked" {
  if (binder.openIssues >= 5) return "blocked";
  if (binder.openIssues >= 1) return "risk";
  return "ready";
}

const readinessDot: Record<string, string> = {
  ready: "bg-emerald-500", risk: "bg-amber-500", blocked: "bg-destructive",
};
const statusColor: Record<string, string> = {
  draft: "text-muted-foreground", active: "text-primary",
  completed: "text-emerald-500", archived: "text-muted-foreground",
};

export default function ContainersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [crFilter, setCrFilter] = useState<string>("");
  const [partnerFilter, setPartnerFilter] = useState<string>("");
  const [arenaFilter, setArenaFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const allBinders = useMemo(() => binderStore.getAll(), []);

  // Extract unique values for filter dropdowns
  const uniquePartners = useMemo(() => [...new Set(allBinders.map(b => b.partner))].sort(), [allBinders]);
  const uniqueArenas = useMemo(() => [...new Set(allBinders.map(b => b.venue))].sort(), [allBinders]);
  const uniqueCRs = useMemo(() => [...new Set(allBinders.map(b => b.controlRoom).filter(Boolean))].sort(), [allBinders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const now = new Date();
    const weekEnd = addDays(now, 7);

    return allBinders.filter((b) => {
      const matchesSearch = !q || b.title.toLowerCase().includes(q) || b.partner.toLowerCase().includes(q) || b.venue.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // Tab filter
      switch (tab) {
        case "today": if (!isToday(new Date(b.eventDate))) return false; break;
        case "week": { const d = new Date(b.eventDate); if (!(d >= now && isBefore(d, weekEnd))) return false; break; }
        case "active": if (b.status !== "active") return false; break;
        case "completed": if (b.status !== "completed") return false; break;
        case "archived": if (b.status !== "archived") return false; break;
        case "drafts": if (b.status !== "draft") return false; break;
      }

      // Additional filters
      if (crFilter && b.controlRoom !== crFilter) return false;
      if (partnerFilter && b.partner !== partnerFilter) return false;
      if (arenaFilter && b.venue !== arenaFilter) return false;
      if (dateFrom) {
        const ed = new Date(b.eventDate);
        if (isBefore(ed, dateFrom)) return false;
      }
      if (dateTo) {
        const ed = new Date(b.eventDate);
        if (isAfter(ed, dateTo)) return false;
      }

      return true;
    });
  }, [search, tab, allBinders, crFilter, partnerFilter, arenaFilter, dateFrom, dateTo]);

  const hasActiveFilters = crFilter || partnerFilter || arenaFilter || dateFrom || dateTo;

  const tabs: { label: string; value: FilterTab; count: number }[] = [
    { label: "All", value: "all", count: allBinders.length },
    { label: "Today", value: "today", count: allBinders.filter((b) => isToday(new Date(b.eventDate))).length },
    { label: "This Week", value: "week", count: allBinders.filter((b) => { const d = new Date(b.eventDate); return d >= new Date() && isBefore(d, addDays(new Date(), 7)); }).length },
    { label: "Active", value: "active", count: allBinders.filter((b) => b.status === "active").length },
    { label: "Completed", value: "completed", count: allBinders.filter((b) => b.status === "completed").length },
    { label: "Archived", value: "archived", count: allBinders.filter((b) => b.status === "archived").length },
    { label: "My Drafts", value: "drafts", count: allBinders.filter((b) => b.status === "draft").length },
  ];

  const selectClass = "text-xs bg-secondary border border-border rounded-sm px-2 py-1.5 text-foreground focus:outline-none focus:border-primary transition-colors appearance-none";

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">Binders</h1>
          <p className="text-sm text-muted-foreground mt-1">{allBinders.length} binders</p>
        </div>
        <Link to="/binders/new"
          className="flex items-center gap-1.5 px-3 py-2 text-xs tracking-wider uppercase rounded-sm border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Binder
        </Link>
      </motion.div>

      {/* Search + Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }} className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search binders…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn("flex items-center gap-1.5 px-3 py-2 text-xs border rounded-sm transition-colors",
              hasActiveFilters ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-end gap-3 p-3 bg-secondary/50 border border-border rounded-sm">
            <div className="space-y-1">
              <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Control Room</label>
              <select value={crFilter} onChange={(e) => setCrFilter(e.target.value)} className={selectClass}>
                <option value="">All CRs</option>
                {uniqueCRs.map(cr => <option key={cr} value={cr}>CR-{cr}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Partner</label>
              <select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)} className={selectClass}>
                <option value="">All Partners</option>
                {uniquePartners.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Arena</label>
              <select value={arenaFilter} onChange={(e) => setArenaFilter(e.target.value)} className={selectClass}>
                <option value="">All Arenas</option>
                {uniqueArenas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Date From</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("text-xs px-2 py-1.5 bg-secondary border border-border rounded-sm text-left min-w-[120px]",
                    dateFrom ? "text-foreground" : "text-muted-foreground")}>
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Start date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Date To</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("text-xs px-2 py-1.5 bg-secondary border border-border rounded-sm text-left min-w-[120px]",
                    dateTo ? "text-foreground" : "text-muted-foreground")}>
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "End date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            {hasActiveFilters && (
              <button onClick={() => { setCrFilter(""); setPartnerFilter(""); setArenaFilter(""); setDateFrom(undefined); setDateTo(undefined); }}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5">
                Clear All
              </button>
            )}
          </motion.div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {tabs.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
                tab === t.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
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
                  <span className="text-[10px] text-destructive shrink-0">{binder.openIssues} issues</span>
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
