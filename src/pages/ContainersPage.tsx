import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, X, Filter, Plus } from "lucide-react";
import { binderStore, inferLeague } from "@/stores/binder-store";
import type { BinderStatus } from "@/stores/binder-store";

interface Container {
  id: string;
  name: string;
  league: string;
  binders: ReturnType<typeof binderStore.getAll>;
}

function groupIntoContainers(binders: ReturnType<typeof binderStore.getAll>): Container[] {
  const map = new Map<string, ReturnType<typeof binderStore.getAll>>();
  binders.forEach((b) => {
    const league = b.league || inferLeague(b.title);
    if (!map.has(league)) map.set(league, []);
    map.get(league)!.push(b);
  });
  return Array.from(map.entries()).map(([league, items], i) => ({
    id: `container-${i}`,
    name: `${league} 2026 Season`,
    league,
    binders: items,
  }));
}

const allStatuses: BinderStatus[] = ["active", "draft", "completed", "archived"];

const statusColor: Record<string, string> = {
  draft: "text-muted-foreground",
  active: "text-crimson",
  completed: "text-emerald-400",
  archived: "text-muted-foreground",
};

export default function ContainersPage() {
  const [search, setSearch] = useState("");
  const [leagueFilter, setLeagueFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BinderStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const allBinders = useMemo(() => binderStore.getAll(), []);
  const allLeagues = useMemo(() => Array.from(new Set(allBinders.map((b) => b.league || inferLeague(b.title)))), [allBinders]);
  const containers = useMemo(() => groupIntoContainers(allBinders), [allBinders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return containers
      .map((c) => ({
        ...c,
        binders: c.binders.filter((b) => {
          const league = b.league || inferLeague(b.title);
          const matchesSearch =
            !q ||
            b.title.toLowerCase().includes(q) ||
            b.partner.toLowerCase().includes(q) ||
            b.venue.toLowerCase().includes(q) ||
            league.toLowerCase().includes(q);
          const matchesLeague = !leagueFilter || league === leagueFilter;
          const matchesStatus = !statusFilter || b.status === statusFilter;
          return matchesSearch && matchesLeague && matchesStatus;
        }),
      }))
      .filter((c) => c.binders.length > 0);
  }, [search, leagueFilter, statusFilter, containers]);

  const totalFiltered = filtered.reduce((sum, c) => sum + c.binders.length, 0);
  const hasActiveFilters = !!leagueFilter || !!statusFilter;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex items-start justify-between"
      >
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">Production Containers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {containers.length} containers · {allBinders.length} binders
          </p>
        </div>
        <Link
          to="/binders/new"
          className="flex items-center gap-1.5 px-3 py-2 text-xs tracking-wider uppercase rounded-sm border border-crimson/40 bg-crimson/10 text-crimson hover:bg-crimson/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Binder
        </Link>
      </motion.div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6 space-y-3"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, partner, venue, league…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs tracking-wider uppercase rounded-md border transition-colors ${
              hasActiveFilters
                ? "border-crimson text-crimson bg-crimson/5"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-4 h-4 rounded-full bg-crimson text-primary-foreground text-[9px] flex items-center justify-center font-mono">
                {(leagueFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-4"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">League</span>
              <div className="flex gap-1">
                {allLeagues.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLeagueFilter(leagueFilter === l ? null : l)}
                    className={`px-2 py-0.5 text-[10px] tracking-wider uppercase rounded border transition-colors ${
                      leagueFilter === l
                        ? "border-crimson bg-crimson/10 text-crimson"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Status</span>
              <div className="flex gap-1">
                {allStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                    className={`px-2 py-0.5 text-[10px] tracking-wider uppercase rounded border transition-colors ${
                      statusFilter === s
                        ? "border-crimson bg-crimson/10 text-crimson"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setLeagueFilter(null); setStatusFilter(null); }}
                className="text-[10px] text-crimson hover:text-crimson/80 transition-colors"
              >
                Clear all
              </button>
            )}
          </motion.div>
        )}

        {(search || hasActiveFilters) && (
          <p className="text-[10px] text-muted-foreground">
            Showing {totalFiltered} binder{totalFiltered !== 1 ? "s" : ""} in {filtered.length} container{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </motion.div>

      {/* Container list */}
      <div className="space-y-6">
        {filtered.length === 0 && (
          <div className="steel-panel px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">No binders match your search.</p>
          </div>
        )}
        {filtered.map((container, ci) => {
          const openIssues = container.binders.reduce((sum, b) => sum + b.openIssues, 0);
          return (
            <motion.div
              key={container.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 + ci * 0.05 }}
              className="steel-panel overflow-hidden"
            >
              <Link
                to={`/containers/${ci}`}
                className="px-5 py-4 border-b border-border flex items-center justify-between hover:bg-secondary/30 transition-colors"
              >
                <div>
                  <h2 className="text-sm font-medium text-foreground">{container.name}</h2>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {container.binders.length} binder{container.binders.length !== 1 ? "s" : ""}
                    {openIssues > 0 && (
                      <span className="ml-2 text-crimson">· {openIssues} issue{openIssues !== 1 ? "s" : ""}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.15em] uppercase font-mono text-muted-foreground">
                    {container.league}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </Link>

              <div className="divide-y divide-border">
                {container.binders.map((binder) => (
                  <Link
                    key={binder.id}
                    to={`/binders/${binder.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate group-hover:text-foreground">{binder.title}</p>
                      <p className="text-[10px] text-muted-foreground">{binder.venue}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{binder.partner}</span>
                    <span className={`text-[10px] tracking-wider uppercase shrink-0 ${statusColor[binder.status]}`}>
                      {binder.status}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      {new Date(binder.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    {binder.openIssues > 0 && (
                      <span className="text-[10px] text-crimson shrink-0">{binder.openIssues} issues</span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </Link>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
