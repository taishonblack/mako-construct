import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, AlertTriangle, CheckCircle, ArrowLeft, Plus } from "lucide-react";
import { format } from "date-fns";
import { useBinders, type BinderRecord } from "@/hooks/use-binders";

function inferReadiness(binder: { openIssues: number }): "ready" | "risk" | "blocked" {
  if (binder.openIssues >= 5) return "blocked";
  if (binder.openIssues >= 1) return "risk";
  return "ready";
}
const readinessDot: Record<string, string> = { ready: "bg-emerald-500", risk: "bg-amber-500", blocked: "bg-destructive" };
const readinessLabel: Record<string, string> = { ready: "text-emerald-500", risk: "text-amber-500", blocked: "text-destructive" };

function StatCard({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div className="steel-panel p-5">
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-2">{label}</span>
      <span className={`text-2xl font-mono font-medium ${alert ? "text-destructive" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

export default function ContainerDetailPage() {
  const { containerId } = useParams<{ containerId: string }>();
  const { binders: allBinders } = useBinders();

  const container = useMemo(() => {
    const leagues = Array.from(new Set(allBinders.map((b) => b.league || "NHL"))).sort();
    const index = parseInt(containerId || "0", 10);
    if (isNaN(index) || index < 0 || index >= leagues.length) return null;
    const league = leagues[index];
    const binders = allBinders.filter((b) => (b.league || "NHL") === league);
    return { id: containerId, name: `${league} 2026 Season`, league, binders };
  }, [containerId, allBinders]);

  const totalIssues = container?.binders.reduce((s, b) => s + b.openIssues, 0) ?? 0;
  const totalISOs = container?.binders.reduce((s, b) => s + b.isoCount, 0) ?? 0;
  const upcoming = useMemo(() => container?.binders.filter((b) => new Date(b.eventDate) >= new Date()) ?? [], [container]);
  const readiness = useMemo(() => {
    const counts = { ready: 0, risk: 0, blocked: 0 };
    container?.binders.forEach((b) => { counts[inferReadiness(b)]++; });
    return counts;
  }, [container]);

  if (!container) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Container not found.</p></div>;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <Link to="/containers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"><ArrowLeft className="w-3.5 h-3.5" />All Containers</Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-medium text-foreground tracking-tight">{container.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{container.binders.length} binder{container.binders.length !== 1 ? "s" : ""} · {container.league}</p>
          </div>
          <Link to={`/binders/new?league=${container.league}`} className="flex items-center gap-1.5 px-3 py-2 text-xs tracking-wider uppercase rounded-sm border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"><Plus className="w-3.5 h-3.5" />New Binder</Link>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard label="Binders" value={container.binders.length} />
        <StatCard label="Total ISOs" value={totalISOs} />
        <StatCard label="Open Issues" value={totalIssues} alert={totalIssues > 0} />
        <StatCard label="Upcoming" value={upcoming.length} />
        <StatCard label="Blocked" value={readiness.blocked} alert={readiness.blocked > 0} />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="steel-panel p-5 mb-8">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Readiness Distribution</h2>
        <div className="flex gap-1 h-3 rounded-sm overflow-hidden mb-3">
          {readiness.ready > 0 && <div className="bg-emerald-500 rounded-sm" style={{ flex: readiness.ready }} />}
          {readiness.risk > 0 && <div className="bg-amber-500 rounded-sm" style={{ flex: readiness.risk }} />}
          {readiness.blocked > 0 && <div className="bg-destructive rounded-sm" style={{ flex: readiness.blocked }} />}
        </div>
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5 text-xs text-foreground"><span className="w-2 h-2 rounded-full bg-emerald-500" /> {readiness.ready} Ready</span>
          <span className="flex items-center gap-1.5 text-xs text-foreground"><span className="w-2 h-2 rounded-full bg-amber-500" /> {readiness.risk} Risk</span>
          <span className="flex items-center gap-1.5 text-xs text-foreground"><span className="w-2 h-2 rounded-full bg-destructive" /> {readiness.blocked} Blocked</span>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="steel-panel overflow-hidden">
        <div className="px-5 py-3 border-b border-border"><h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Event Binders</h2></div>
        <div className="divide-y divide-border">
          {container.binders.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()).map((binder) => {
            const r = inferReadiness(binder);
            return (
              <Link key={binder.id} to={`/binders/${binder.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-secondary/50 transition-colors group">
                <div className={`w-2 h-2 rounded-full shrink-0 ${readinessDot[r]}`} />
                <div className="flex-1 min-w-0"><p className="text-sm text-foreground truncate">{binder.title}</p><p className="text-[10px] text-muted-foreground">{binder.venue}</p></div>
                <span className="text-xs text-muted-foreground shrink-0">{binder.partner}</span>
                <span className="text-xs font-mono text-muted-foreground shrink-0">{format(new Date(binder.eventDate), "MMM d")}</span>
                <span className={`text-[10px] tracking-wider uppercase shrink-0 ${readinessLabel[r]}`}>{r}</span>
                {binder.openIssues > 0 && <span className="flex items-center gap-1 text-[10px] text-destructive shrink-0"><AlertTriangle className="w-3 h-3" />{binder.openIssues}</span>}
                {binder.openIssues === 0 && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
