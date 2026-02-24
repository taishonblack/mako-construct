import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, ChevronRight, Zap, Clock } from "lucide-react";
import { format, isToday, isBefore, addDays } from "date-fns";
import { binderStore } from "@/stores/binder-store";
import {
  PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";

function inferReadiness(binder: { openIssues: number }): "ready" | "risk" | "blocked" {
  if (binder.openIssues >= 5) return "blocked";
  if (binder.openIssues >= 1) return "risk";
  return "ready";
}

const readinessDot: Record<string, string> = {
  ready: "bg-emerald-400", risk: "bg-amber-400", blocked: "bg-crimson",
};
const readinessLabel: Record<string, string> = {
  ready: "text-emerald-400", risk: "text-amber-400", blocked: "text-crimson",
};

function StatCard({ label, value, alert, sub }: { label: string; value: string | number; alert?: boolean; sub?: string }) {
  return (
    <div className="steel-panel p-5">
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-2">{label}</span>
      <span className={`text-2xl font-mono font-medium ${alert ? "text-crimson" : "text-foreground"}`}>{value}</span>
      {sub && <span className="text-xs text-muted-foreground block mt-1">{sub}</span>}
    </div>
  );
}

interface ChecklistTaskAgg {
  id: string; label: string; checked: boolean;
  binderId: string; binderTitle: string; eventDate: string;
}

function loadUpcomingChecklist(): ChecklistTaskAgg[] {
  const binders = binderStore.getAll().filter((b) => b.status === "active");
  const tasks: ChecklistTaskAgg[] = [];
  for (const binder of binders) {
    try {
      const raw = localStorage.getItem(`mako-binder-${binder.id}`);
      if (!raw) continue;
      const state = JSON.parse(raw);
      if (!state.checklist) continue;
      for (const item of state.checklist) {
        if (!item.checked) {
          tasks.push({ id: `${binder.id}-${item.id}`, label: item.label, checked: false,
            binderId: binder.id, binderTitle: binder.title, eventDate: binder.eventDate });
        }
      }
    } catch { /* ignore */ }
  }
  return tasks.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()).slice(0, 8);
}

export default function DashboardPage() {
  const allBinders = useMemo(() => binderStore.getAll(), []);
  const now = new Date();
  const weekEnd = addDays(now, 7);

  const draftCount = allBinders.filter((b) => b.status === "draft").length;
  const activeCount = allBinders.filter((b) => b.status === "active").length;
  const todayCount = allBinders.filter((b) => isToday(new Date(b.eventDate))).length;
  const weekCount = allBinders.filter((b) => {
    const d = new Date(b.eventDate);
    return d >= now && isBefore(d, weekEnd);
  }).length;

  const readinessBreakdown = useMemo(() => {
    const counts = { ready: 0, risk: 0, blocked: 0 };
    allBinders.filter((b) => b.status === "active" || b.status === "draft").forEach((b) => { counts[inferReadiness(b)]++; });
    return counts;
  }, [allBinders]);

  const pieData = [
    { name: "Ready", value: readinessBreakdown.ready, color: "hsl(160, 84%, 39%)" },
    { name: "Risk", value: readinessBreakdown.risk, color: "hsl(45, 93%, 47%)" },
    { name: "Blocked", value: readinessBreakdown.blocked, color: "hsl(357, 82%, 31%)" },
  ].filter((d) => d.value > 0);

  const recentlyChanged = useMemo(() =>
    [...allBinders]
      .filter((b) => {
        const updated = new Date(b.updatedAt);
        const twoDaysAgo = addDays(now, -2);
        return updated >= twoDaysAgo;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8),
  [allBinders]);

  const upcomingChecklist = useMemo(() => loadUpcomingChecklist(), []);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
        <h1 className="text-xl font-medium text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">NHL production operations overview</p>
      </motion.div>

      {/* Top stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard label="Drafts" value={draftCount} sub="your private binders" />
        <StatCard label="Active" value={activeCount} alert={activeCount === 0} sub="visible to team" />
        <StatCard label="Today" value={todayCount} sub={todayCount > 0 ? "games today" : "no games today"} />
        <StatCard label="This Week" value={weekCount} sub="upcoming 7 days" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Readiness chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }} className="steel-panel p-5">
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Readiness Breakdown</h2>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-400" /><span className="text-sm text-foreground">{readinessBreakdown.ready} Ready</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-sm text-foreground">{readinessBreakdown.risk} Risk</span></div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-crimson" /><span className="text-sm text-foreground">{readinessBreakdown.blocked} Blocked</span></div>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Checklist Tasks */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }} className="steel-panel p-5 lg:col-span-2">
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Upcoming Checklist Tasks</h2>
          {upcomingChecklist.length > 0 ? (
            <div className="space-y-2">
              {upcomingChecklist.map((task) => (
                <Link key={task.id} to={`/binders/${task.binderId}`}
                  className="flex items-center gap-3 p-2.5 rounded bg-secondary/50 hover:bg-secondary transition-colors">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{task.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{task.binderTitle}</p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                    {format(new Date(task.eventDate), "MMM d")}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-emerald-400 py-4 justify-center">
              <CheckCircle className="w-4 h-4" /> All tasks complete
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attention Required */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }} className="steel-panel p-5">
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Attention Required</h2>
          <div className="space-y-2">
            {allBinders
              .filter((b) => b.openIssues > 0 && (b.status === "active" || b.status === "draft"))
              .sort((a, b) => b.openIssues - a.openIssues)
              .slice(0, 6)
              .map((binder) => {
                const readiness = inferReadiness(binder);
                return (
                  <Link key={binder.id} to={`/binders/${binder.id}`}
                    className="flex items-center gap-3 p-3 rounded bg-secondary/50 hover:bg-secondary transition-colors">
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${readinessLabel[readiness]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{binder.title}</p>
                      <p className="text-[10px] text-muted-foreground">{binder.partner}</p>
                    </div>
                    <span className="text-xs text-crimson font-mono shrink-0">{binder.openIssues} issues</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            {allBinders.filter((b) => b.openIssues > 0).length === 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 py-4 justify-center">
                <CheckCircle className="w-4 h-4" /> All clear — no blocking issues
              </div>
            )}
          </div>
        </motion.div>

        {/* Recently Changed */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }} className="steel-panel p-5">
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Recently Changed</h2>
          <div className="space-y-2">
            {recentlyChanged.map((binder) => (
              <Link key={binder.id} to={`/binders/${binder.id}`}
                className="flex items-start gap-3 p-3 rounded bg-secondary/50 hover:bg-secondary transition-colors">
                <Zap className="w-3.5 h-3.5 text-crimson shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{binder.title}</p>
                  <p className="text-[10px] text-muted-foreground">{binder.partner} · {binder.venue}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {format(new Date(binder.updatedAt), "MMM d HH:mm")}
                </span>
              </Link>
            ))}
            {recentlyChanged.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent changes</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
