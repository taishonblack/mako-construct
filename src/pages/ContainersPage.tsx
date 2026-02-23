import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ChevronRight, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { mockBinders } from "@/data/mock-binders";

// Group binders into containers by league
interface Container {
  id: string;
  name: string;
  league: string;
  binders: typeof mockBinders;
}

function inferLeague(title: string): string {
  if (title.includes("NBA") || title.includes("WNBA")) return "NBA";
  if (title.includes("NFL")) return "NFL";
  if (title.includes("MLS")) return "MLS";
  if (title.includes("NHL")) return "NHL";
  if (title.includes("College")) return "NCAA";
  return "Other";
}

function groupIntoContainers(binders: typeof mockBinders): Container[] {
  const map = new Map<string, typeof mockBinders>();
  binders.forEach((b) => {
    const league = inferLeague(b.title);
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

const statusColor: Record<string, string> = {
  draft: "text-muted-foreground",
  active: "text-crimson",
  completed: "text-emerald-400",
  archived: "text-muted-foreground",
};

export default function ContainersPage() {
  const [search, setSearch] = useState("");
  const containers = groupIntoContainers(mockBinders);

  const filtered = containers
    .map((c) => ({
      ...c,
      binders: c.binders.filter((b) => {
        const q = search.toLowerCase();
        return (
          b.title.toLowerCase().includes(q) ||
          b.partner.toLowerCase().includes(q) ||
          b.venue.toLowerCase().includes(q)
        );
      }),
    }))
    .filter((c) => c.binders.length > 0);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-xl font-medium text-foreground tracking-tight">Production Containers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {containers.length} containers · {mockBinders.length} binders
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-6"
      >
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search binders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors"
          />
        </div>
      </motion.div>

      {/* Container list */}
      <div className="space-y-6">
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

              {/* Binder rows */}
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
