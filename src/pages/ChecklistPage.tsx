import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, CheckSquare, ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";
import { format, isToday, addDays, isBefore, isPast } from "date-fns";
import { binderStore } from "@/stores/binder-store";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import type { ChecklistStatus } from "@/hooks/use-binder-state";

interface TaskRow {
  id: string;
  rawId: string;
  label: string;
  checked: boolean;
  assignedTo: string;
  dueAt: string;
  createdAt: string;
  status: ChecklistStatus;
}

interface BinderGroup {
  binderId: string;
  binderTitle: string;
  eventDate: string;
  binderStatus: string;
  tasks: TaskRow[];
  counts: { open: number; dueToday: number; overdue: number; unassigned: number };
}

function loadGroups(): BinderGroup[] {
  const binders = binderStore.getAll();
  const groups: BinderGroup[] = [];
  for (const b of binders) {
    try {
      const raw = localStorage.getItem(`mako-binder-${b.id}`);
      if (!raw) continue;
      const state = JSON.parse(raw);
      if (!state.checklist || state.checklist.length === 0) continue;
      const tasks: TaskRow[] = state.checklist.map((item: any) => ({
        id: `${b.id}-${item.id}`,
        rawId: item.id,
        label: item.label,
        checked: item.checked,
        assignedTo: item.assignedTo || "",
        dueAt: item.dueAt || "",
        createdAt: item.createdAt || "",
        status: item.status || (item.checked ? "done" : "open"),
      }));
      const now = new Date();
      const open = tasks.filter(t => !t.checked && t.status !== "done").length;
      const dueToday = tasks.filter(t => t.dueAt && isToday(new Date(t.dueAt)) && t.status !== "done").length;
      const overdue = tasks.filter(t => t.dueAt && isPast(new Date(t.dueAt)) && !isToday(new Date(t.dueAt)) && t.status !== "done").length;
      const unassigned = tasks.filter(t => !t.assignedTo && t.status !== "done").length;
      groups.push({
        binderId: b.id, binderTitle: b.title, eventDate: b.eventDate, binderStatus: b.status,
        tasks, counts: { open, dueToday, overdue, unassigned },
      });
    } catch { /* ignore */ }
  }
  groups.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  return groups;
}

type FilterMode = "all" | "today" | "week" | "incomplete" | "assigned";

const STATUS_STYLE: Record<string, string> = {
  open: "border-muted-foreground/40 text-muted-foreground",
  "in-progress": "border-amber-500/40 text-amber-500 bg-amber-500/10",
  done: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
};

const BINDER_STATUS_STYLE: Record<string, string> = {
  draft: "border-muted-foreground/40 text-muted-foreground",
  active: "border-primary/40 text-primary bg-primary/10",
  complete: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
  archived: "border-muted-foreground/30 text-muted-foreground/60",
};

export default function ChecklistPage() {
  const [filter, setFilter] = useState<FilterMode>("incomplete");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [, bump] = useState(0);

  const groups = useMemo(() => loadGroups(), [filter, bump]);

  const filterTask = useCallback((t: TaskRow, eventDate: string) => {
    const now = new Date();
    const weekEnd = addDays(now, 7);
    if (filter === "incomplete" && (t.checked || t.status === "done")) return false;
    if (filter === "today") {
      const d = t.dueAt ? new Date(t.dueAt) : null;
      return d ? isToday(d) : false;
    }
    if (filter === "week") {
      const d = t.dueAt ? new Date(t.dueAt) : null;
      return d ? d >= now && isBefore(d, weekEnd) : false;
    }
    if (filter === "assigned") return !!t.assignedTo;
    return true;
  }, [filter]);

  const visibleGroups = useMemo(() => {
    return groups
      .filter(g => g.binderStatus !== "archived")
      .map(g => ({ ...g, tasks: g.tasks.filter(t => filterTask(t, g.eventDate)).sort((a, b) => {
        const aDone = a.status === "done" ? 1 : 0;
        const bDone = b.status === "done" ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        const aD = a.dueAt || "9999";
        const bD = b.dueAt || "9999";
        return new Date(aD).getTime() - new Date(bD).getTime();
      }) }))
      .filter(g => g.tasks.length > 0);
  }, [groups, filterTask]);

  const toggleItem = (binderId: string, t: TaskRow) => {
    try {
      const raw = localStorage.getItem(`mako-binder-${binderId}`);
      if (!raw) return;
      const state = JSON.parse(raw);
      const newStatus: ChecklistStatus = (t.checked || t.status === "done") ? "open" : "done";
      state.checklist = state.checklist.map((c: any) =>
        c.id === t.rawId ? { ...c, checked: newStatus === "done", status: newStatus } : c
      );
      localStorage.setItem(`mako-binder-${binderId}`, JSON.stringify(state));
    } catch { /* ignore */ }
    bump(n => n + 1);
  };

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (collapsed.size === visibleGroups.length) {
      setCollapsed(new Set());
    } else {
      setCollapsed(new Set(visibleGroups.map(g => g.binderId)));
    }
  };

  const totalOpen = groups.reduce((s, g) => s + g.counts.open, 0);

  const filters: { label: string; value: FilterMode }[] = [
    { label: "Incomplete", value: "incomplete" },
    { label: "Due Today", value: "today" },
    { label: "Next 7 Days", value: "week" },
    { label: "Assigned", value: "assigned" },
    { label: "All", value: "all" },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="text-xl font-medium text-foreground tracking-tight">Task Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalOpen} open task{totalOpen !== 1 ? "s" : ""} across {groups.length} binder{groups.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {filters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
                filter === f.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>{f.label}</button>
          ))}
        </div>
        <button onClick={toggleAll} className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
          <ChevronsUpDown className="w-3 h-3" />
          {collapsed.size === visibleGroups.length ? "Expand All" : "Collapse All"}
        </button>
      </div>

      {/* Binder groups */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {visibleGroups.length > 0 ? visibleGroups.map(g => {
            const isOpen = !collapsed.has(g.binderId);
            return (
              <motion.div key={g.binderId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="steel-panel overflow-hidden">
                {/* Binder header */}
                <button onClick={() => toggleCollapse(g.binderId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left">
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/binders/${g.binderId}#checklist`} onClick={e => e.stopPropagation()}
                        className="text-sm font-medium text-primary hover:underline underline-offset-2 truncate">
                        {g.binderTitle}
                      </Link>
                      <Badge variant="outline" className={`text-[9px] tracking-wider uppercase font-medium ${BINDER_STATUS_STYLE[g.binderStatus] || BINDER_STATUS_STYLE.draft}`}>
                        {g.binderStatus}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(g.eventDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] tracking-wider uppercase shrink-0">
                    <span className="text-muted-foreground">{g.counts.open} open</span>
                    {g.counts.dueToday > 0 && <span className="text-primary">{g.counts.dueToday} today</span>}
                    {g.counts.overdue > 0 && <span className="text-destructive">{g.counts.overdue} overdue</span>}
                    {g.counts.unassigned > 0 && <span className="text-muted-foreground/60">{g.counts.unassigned} unassigned</span>}
                  </div>
                </button>

                {/* Task table */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-8"></TableHead>
                            <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Task</TableHead>
                            <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Assigned To</TableHead>
                            <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Due</TableHead>
                            <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {g.tasks.map(t => {
                            const isDone = t.checked || t.status === "done";
                            return (
                              <TableRow key={t.id} className="border-border group">
                                <TableCell className="w-8 pr-0">
                                  <button onClick={() => toggleItem(g.binderId, t)} className="p-0.5">
                                    {isDone
                                      ? <CheckSquare className="w-4 h-4 text-emerald-500" />
                                      : <div className="w-4 h-4 border border-muted-foreground/50 rounded-sm group-hover:border-foreground transition-colors" />}
                                  </button>
                                </TableCell>
                                <TableCell className={`text-sm ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                                  {t.label}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {t.assignedTo
                                    ? <span className="text-foreground">{t.assignedTo}</span>
                                    : <span className="text-muted-foreground/60 italic">Unassigned</span>}
                                </TableCell>
                                <TableCell className="text-sm font-mono text-muted-foreground">
                                  {t.dueAt ? format(new Date(t.dueAt), "MMM d, HH:mm") : "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline"
                                    className={`text-[9px] tracking-wider uppercase font-medium ${STATUS_STYLE[t.status] || STATUS_STYLE.open}`}>
                                    {t.status === "in-progress" ? "In Progress" : t.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          }) : (
            <div className="steel-panel px-6 py-12 text-center">
              <CheckSquare className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {filter === "incomplete" ? "All tasks complete." : "No tasks match this filter."}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
