import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { binderStore } from "@/stores/binder-store";

function inferReadiness(binder: { openIssues: number }): "ready" | "risk" | "blocked" {
  if (binder.openIssues >= 5) return "blocked";
  if (binder.openIssues >= 1) return "risk";
  return "ready";
}

const readinessDot: Record<string, string> = {
  ready: "bg-emerald-400",
  risk: "bg-amber-400",
  blocked: "bg-crimson",
};

const readinessText: Record<string, string> = {
  ready: "text-emerald-400",
  risk: "text-amber-400",
  blocked: "text-crimson",
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [filterPartner, setFilterPartner] = useState<string>("all");
  const [filterControlRoom, setFilterControlRoom] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const allBinders = useMemo(() => binderStore.getAll(), []);
  const allPartners = useMemo(() => [...new Set(allBinders.map((b) => b.partner))], [allBinders]);

  const filteredBinders = useMemo(() => {
    return allBinders.filter((b) => {
      if (filterPartner !== "all" && b.partner !== filterPartner) return false;
      if (filterControlRoom !== "all" && b.controlRoom !== filterControlRoom) return false;
      if (filterStatus !== "all" && b.status !== filterStatus) return false;
      return true;
    });
  }, [allBinders, filterPartner, filterControlRoom, filterStatus]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const bindersByDate = useMemo(() => {
    const map = new Map<string, typeof filteredBinders>();
    filteredBinders.forEach((b) => {
      const key = b.eventDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    });
    return map;
  }, [filteredBinders]);

  const selectedBinders = selectedDay
    ? (bindersByDate.get(format(selectedDay, "yyyy-MM-dd")) || [])
    : [];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium text-foreground tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredBinders.length} binder{filteredBinders.length !== 1 ? "s" : ""} scheduled
          </p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 text-xs border rounded-md transition-colors ${
            showFilters ? "border-crimson text-foreground bg-secondary" : "border-border text-muted-foreground hover:border-crimson hover:text-foreground"
          }`}>
          <Filter className="w-3.5 h-3.5" /> Filters
        </button>
      </motion.div>

      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="steel-panel p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1.5">Status</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full text-sm bg-secondary border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-crimson">
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1.5">Control Room</label>
              <select value={filterControlRoom} onChange={(e) => setFilterControlRoom(e.target.value)}
                className="w-full text-sm bg-secondary border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-crimson">
                <option value="all">All</option>
                <option value="23">CR-23</option>
                <option value="26">CR-26</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1.5">Partner</label>
              <select value={filterPartner} onChange={(e) => setFilterPartner(e.target.value)}
                className="w-full text-sm bg-secondary border border-border rounded px-2 py-1.5 text-foreground focus:outline-none focus:border-crimson">
                <option value="all">All Partners</option>
                {allPartners.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }} className="lg:col-span-2">
          <div className="steel-panel">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-crimson hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-sm font-medium text-foreground tracking-tight">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="w-8 h-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:border-crimson hover:text-foreground transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 px-2 pt-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-[10px] tracking-wider uppercase text-muted-foreground py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 px-2 pb-3">
              {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} className="aspect-square p-1" />)}
              {days.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayBinders = bindersByDate.get(dateKey) || [];
                const isSelected = selectedDay && isSameDay(day, selectedDay);
                const today = isSameDay(day, new Date());
                return (
                  <button key={dateKey} onClick={() => setSelectedDay(day)}
                    className={`aspect-square p-1 flex flex-col items-center justify-start rounded-sm transition-colors relative ${
                      isSelected ? "bg-secondary border border-crimson/40" : "hover:bg-secondary/50 border border-transparent"
                    }`}>
                    <span className={`text-xs font-mono ${today ? "text-crimson font-medium" : isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                      {format(day, "d")}
                    </span>
                    {dayBinders.length > 0 && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {dayBinders.slice(0, 3).map((b) => (
                          <div key={b.id} className={`w-1.5 h-1.5 rounded-full ${readinessDot[inferReadiness(b)]}`} />
                        ))}
                        {dayBinders.length > 3 && <span className="text-[8px] text-muted-foreground ml-0.5">+{dayBinders.length - 3}</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 px-5 py-3 border-t border-border">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-[10px] text-muted-foreground">Ready</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[10px] text-muted-foreground">Risk</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-crimson" /><span className="text-[10px] text-muted-foreground">Blocked</span></div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <div className="steel-panel p-5">
            {selectedDay ? (
              <>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{format(selectedDay, "EEEE")}</h3>
                <p className="text-lg font-medium text-foreground mb-4">{format(selectedDay, "MMMM d, yyyy")}</p>
                {selectedBinders.length > 0 ? (
                  <div className="space-y-3">
                    {selectedBinders.map((binder) => {
                      const readiness = inferReadiness(binder);
                      return (
                        <Link key={binder.id} to={`/binders/${binder.id}`}
                          className="block p-3 rounded bg-secondary/50 hover:bg-secondary transition-colors group">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className={`w-2 h-2 rounded-full ${readinessDot[readiness]}`} />
                            <span className="text-sm font-medium text-foreground">{binder.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span>{binder.venue}</span>
                            {binder.controlRoom && <span>CR-{binder.controlRoom}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-[10px]">
                            <span className="text-muted-foreground">{binder.partner}</span>
                            <span className="font-mono text-muted-foreground">{binder.isoCount} ISOs</span>
                            <span className={readinessText[readiness]}>{readiness.toUpperCase()}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No binders scheduled</p>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Select a date to view binders</p>
              </div>
            )}
          </div>

          <div className="steel-panel p-5 mt-4">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Upcoming</h3>
            <div className="space-y-2">
              {filteredBinders
                .filter((b) => new Date(b.eventDate) >= new Date())
                .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                .slice(0, 5)
                .map((binder) => {
                  const readiness = inferReadiness(binder);
                  return (
                    <Link key={binder.id} to={`/binders/${binder.id}`}
                      className="flex items-center gap-3 py-2 px-2 rounded hover:bg-secondary/50 transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${readinessDot[readiness]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{binder.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(binder.eventDate), "MMM d")} · {binder.partner}
                        </p>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
