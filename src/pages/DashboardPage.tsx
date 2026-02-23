import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Clock, ChevronRight, Zap } from "lucide-react";
import { format } from "date-fns";
import { mockBinders } from "@/data/mock-binders";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";

function inferLeague(title: string): string {
  if (title.includes("NBA") || title.includes("WNBA")) return "NBA";
  if (title.includes("NFL")) return "NFL";
  if (title.includes("MLS")) return "MLS";
  if (title.includes("NHL")) return "NHL";
  if (title.includes("College")) return "NCAA";
  return "Other";
}

function inferReadiness(binder: typeof mockBinders[0]): "ready" | "risk" | "blocked" {
  if (binder.openIssues >= 5) return "blocked";
  if (binder.openIssues >= 1) return "risk";
  return "ready";
}

const readinessDot: Record<string, string> = {
  ready: "bg-emerald-400",
  risk: "bg-amber-400",
  blocked: "bg-crimson",
};

const readinessLabel: Record<string, string> = {
  ready: "text-emerald-400",
  risk: "text-amber-400",
  blocked: "text-crimson",
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

// Simulated recent changes derived from mock data
function getRecentChanges() {
  const changeTypes = [
    "ISO count updated",
    "Transport profile modified",
    "Backup transport added",
    "Return feed toggled",
    "Signal alias renamed",
    "Checklist item completed",
    "Comms channel reassigned",
    "Encoder allocation changed",
    "Issue resolved",
    "Production definition updated",
  ];

  return mockBinders
    .filter((b) => b.updatedAt)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)
    .map((binder, i) => ({
      id: `change-${binder.id}-${i}`,
      binderId: binder.id,
      binderTitle: binder.title,
      change: changeTypes[i % changeTypes.length],
      timestamp: binder.updatedAt,
    }));
}

export default function DashboardPage() {
  const totalBinders = mockBinders.length;
  const upcoming = mockBinders.filter((b) => new Date(b.eventDate) >= new Date());
  const totalIssues = mockBinders.reduce((s, b) => s + b.openIssues, 0);
  const totalISOs = mockBinders.reduce((s, b) => s + b.isoCount, 0);

  const readinessBreakdown = useMemo(() => {
    const counts = { ready: 0, risk: 0, blocked: 0 };
    mockBinders.forEach((b) => { counts[inferReadiness(b)]++; });
    return counts;
  }, []);

  const pieData = [
    { name: "Ready", value: readinessBreakdown.ready, color: "hsl(160, 84%, 39%)" },
    { name: "Risk", value: readinessBreakdown.risk, color: "hsl(45, 93%, 47%)" },
    { name: "Blocked", value: readinessBreakdown.blocked, color: "hsl(357, 82%, 31%)" },
  ].filter((d) => d.value > 0);

  const leagueData = useMemo(() => {
    const map = new Map<string, { league: string; binders: number; issues: number }>();
    mockBinders.forEach((b) => {
      const league = inferLeague(b.title);
      if (!map.has(league)) map.set(league, { league, binders: 0, issues: 0 });
      const entry = map.get(league)!;
      entry.binders++;
      entry.issues += b.openIssues;
    });
    return Array.from(map.values());
  }, []);

  const recentChanges = useMemo(() => getRecentChanges(), []);
  const blockingCount = readinessBreakdown.blocked;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-xl font-medium text-foreground tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Operational overview across all production containers</p>
      </motion.div>

      {/* Top stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
      >
        <StatCard label="Total Binders" value={totalBinders} sub={`${upcoming.length} upcoming`} />
        <StatCard label="Total ISOs" value={totalISOs} sub="across all events" />
        <StatCard label="Open Issues" value={totalIssues} alert={totalIssues > 0} sub={`${blockingCount} blocking`} />
        <StatCard label="Readiness" value={`${readinessBreakdown.ready}/${totalBinders}`} alert={blockingCount > 0} sub={blockingCount > 0 ? `${blockingCount} blocked` : "all clear"} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Readiness chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="steel-panel p-5"
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Readiness Breakdown</h2>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm text-foreground">{readinessBreakdown.ready} Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-sm text-foreground">{readinessBreakdown.risk} Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-crimson" />
                <span className="text-sm text-foreground">{readinessBreakdown.blocked} Blocked</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Issues by league */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="steel-panel p-5 lg:col-span-2"
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Issues by League</h2>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leagueData} barSize={24}>
                <XAxis dataKey="league" tick={{ fill: "hsl(216, 8%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(216, 8%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ background: "hsl(210, 10%, 8%)", border: "1px solid hsl(210, 8%, 16%)", borderRadius: "4px", fontSize: 12, color: "hsl(216, 10%, 75%)" }} />
                <Bar dataKey="issues" fill="hsl(357, 82%, 31%)" radius={[2, 2, 0, 0]} name="Issues" />
                <Bar dataKey="binders" fill="hsl(210, 8%, 25%)" radius={[2, 2, 0, 0]} name="Binders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Upcoming + Blocking + Recent Changes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="steel-panel p-5"
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Upcoming Events</h2>
          <div className="space-y-2">
            {upcoming
              .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
              .slice(0, 6)
              .map((binder) => {
                const readiness = inferReadiness(binder);
                return (
                  <Link
                    key={binder.id}
                    to={`/binders/${binder.id}`}
                    className="flex items-center gap-3 p-3 rounded bg-secondary/50 hover:bg-secondary transition-colors group"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${readinessDot[readiness]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{binder.title}</p>
                      <p className="text-[10px] text-muted-foreground">{binder.venue}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono text-muted-foreground block">
                        {format(new Date(binder.eventDate), "MMM d")}
                      </span>
                      <span className={`text-[10px] tracking-wider uppercase ${readinessLabel[readiness]}`}>
                        {readiness}
                      </span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
          </div>
        </motion.div>

        {/* Blocking issues */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="steel-panel p-5"
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Attention Required</h2>
          <div className="space-y-2">
            {mockBinders
              .filter((b) => b.openIssues > 0)
              .sort((a, b) => b.openIssues - a.openIssues)
              .map((binder) => {
                const readiness = inferReadiness(binder);
                return (
                  <Link
                    key={binder.id}
                    to={`/binders/${binder.id}`}
                    className="flex items-center gap-3 p-3 rounded bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${readinessLabel[readiness]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{binder.title}</p>
                      <p className="text-[10px] text-muted-foreground">{binder.partner} · {inferLeague(binder.title)}</p>
                    </div>
                    <span className="text-xs text-crimson font-mono shrink-0">{binder.openIssues} issues</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            {mockBinders.filter((b) => b.openIssues > 0).length === 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 py-4 justify-center">
                <CheckCircle className="w-4 h-4" />
                All clear — no blocking issues
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Changes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="steel-panel p-5"
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-4">Recent Changes</h2>
          <div className="space-y-2">
            {recentChanges.map((change) => (
              <Link
                key={change.id}
                to={`/binders/${change.binderId}`}
                className="flex items-start gap-3 p-3 rounded bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-crimson shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{change.change}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{change.binderTitle}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {format(new Date(change.timestamp), "MMM d")}
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
