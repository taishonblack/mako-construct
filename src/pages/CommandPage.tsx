import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Radio,
  ChevronRight,
  Wifi,
  WifiOff,
  Shield,
  Clock,
} from "lucide-react";
import { format, isToday, differenceInHours } from "date-fns";
import { mockBinders } from "@/data/mock-binders";

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

function inferLeague(title: string): string {
  if (title.includes("NBA") || title.includes("WNBA")) return "NBA";
  if (title.includes("NFL")) return "NFL";
  if (title.includes("MLS")) return "MLS";
  if (title.includes("NHL")) return "NHL";
  if (title.includes("College")) return "NCAA";
  return "Other";
}

export default function CommandPage() {
  const now = new Date();

  const todayEvents = useMemo(
    () =>
      mockBinders
        .filter((b) => isToday(new Date(b.eventDate)))
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()),
    []
  );

  const upcomingWithin4h = useMemo(
    () =>
      mockBinders.filter((b) => {
        const d = new Date(b.eventDate);
        const h = differenceInHours(d, now);
        return h >= 0 && h <= 4 && !isToday(d);
      }),
    []
  );

  const liveEvents = [...todayEvents, ...upcomingWithin4h];

  const allIssues = useMemo(
    () =>
      mockBinders
        .filter((b) => b.openIssues > 0)
        .sort((a, b) => b.openIssues - a.openIssues),
    []
  );

  const hasActivity = liveEvents.length > 0;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${hasActivity ? "bg-crimson animate-pulse" : "bg-muted-foreground"}`} />
          <h1 className="text-xl font-medium text-foreground tracking-tight">Command</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Cross-event operational surface — real-time league monitoring
        </p>
      </motion.div>

      {!hasActivity ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="steel-panel p-12 text-center"
        >
          <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-4 opacity-40" />
          <p className="text-sm text-muted-foreground tracking-wider uppercase">
            Command surface idle
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            No events currently live or within the next 4 hours
          </p>
        </motion.div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Live events panel */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-3 space-y-3"
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            {hasActivity ? "Live & Imminent Events" : "All Events Today"}
          </h2>

          {(hasActivity ? liveEvents : mockBinders.slice(0, 4)).map((binder) => {
            const readiness = inferReadiness(binder);
            const league = inferLeague(binder.title);
            return (
              <Link
                key={binder.id}
                to={`/binders/${binder.id}`}
                className="steel-panel p-4 block hover:border-crimson/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="pt-1">
                    <div className={`w-3 h-3 rounded-full ${readinessDot[readiness]} ${readiness === "blocked" ? "animate-pulse" : ""}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{binder.title}</p>
                      <span className="text-[10px] tracking-wider uppercase text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {league}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{binder.venue}</p>

                    <div className="flex items-center gap-4 mt-3 text-[10px] tracking-wider uppercase">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Shield className="w-3 h-3" />
                        {binder.isoCount} ISOs
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        {binder.transport === "SRT" ? (
                          <Wifi className="w-3 h-3" />
                        ) : (
                          <WifiOff className="w-3 h-3" />
                        )}
                        {binder.transport}
                      </span>
                      <span className={`flex items-center gap-1 ${readinessLabel[readiness]}`}>
                        {readiness === "blocked" && <AlertTriangle className="w-3 h-3" />}
                        {readiness}
                      </span>
                      {binder.openIssues > 0 && (
                        <span className="text-crimson">{binder.openIssues} issues</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono text-muted-foreground">
                      {format(new Date(binder.eventDate), "MMM d")}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </motion.div>

        {/* Active issue stream */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
            Active Issue Stream
          </h2>
          <div className="steel-panel p-4 space-y-2">
            {allIssues.length === 0 ? (
              <p className="text-sm text-emerald-400 text-center py-6">All clear</p>
            ) : (
              allIssues.map((binder) => {
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
                      <p className="text-[10px] text-muted-foreground">{binder.partner}</p>
                    </div>
                    <span className="text-xs text-crimson font-mono shrink-0">
                      {binder.openIssues}
                    </span>
                  </Link>
                );
              })
            )}
          </div>

          {/* Transport overview */}
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3 mt-6">
            Transport Summary
          </h2>
          <div className="steel-panel p-4">
            {["SRT", "MPEG-TS"].map((proto) => {
              const count = mockBinders.filter((b) => b.transport === proto).length;
              return (
                <div key={proto} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{proto}</span>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{count} events</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
