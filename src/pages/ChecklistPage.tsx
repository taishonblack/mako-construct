import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, ArrowUpDown, CheckSquare, X } from "lucide-react";
import { format, isToday, addDays, isBefore } from "date-fns";
import { binderStore } from "@/stores/binder-store";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
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
  binderId: string;
  binderTitle: string;
  eventDate: string;
  binderStatus: string;
}

function loadTasks(): TaskRow[] {
  const binders = binderStore.getAll();
  const rows: TaskRow[] = [];
  for (const b of binders) {
    try {
      const raw = localStorage.getItem(`mako-binder-${b.id}`);
      if (!raw) continue;
      const state = JSON.parse(raw);
      if (!state.checklist) continue;
      for (const item of state.checklist) {
        rows.push({
          id: `${b.id}-${item.id}`,
          rawId: item.id,
          label: item.label,
          checked: item.checked,
          assignedTo: item.assignedTo || "",
          dueAt: item.dueAt || "",
          createdAt: item.createdAt || "",
          status: item.status || (item.checked ? "done" : "open"),
          binderId: b.id,
          binderTitle: b.title,
          eventDate: b.eventDate,
          binderStatus: b.status,
        });
      }
    } catch { /* ignore */ }
  }
  return rows;
}

type FilterMode = "all" | "today" | "week" | "incomplete" | "assigned";
type SortKey = "due" | "binder" | "assigned";

const STATUS_STYLE: Record<string, string> = {
  open: "border-muted-foreground/40 text-muted-foreground",
  "in-progress": "border-amber-500/40 text-amber-500 bg-amber-500/10",
  done: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
};

export default function ChecklistPage() {
  const [filter, setFilter] = useState<FilterMode>("incomplete");
  const [sortKey, setSortKey] = useState<SortKey>("due");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [, bump] = useState(0);

  const allTasks = useMemo(() => loadTasks(), [filter, bump]);

  const filtered = useMemo(() => {
    const now = new Date();
    const weekEnd = addDays(now, 7);
    return allTasks.filter((t) => {
      if (t.binderStatus === "archived") return false;
      if (filter === "incomplete" && (t.checked || t.status === "done")) return false;
      if (filter === "today") {
        const d = t.dueAt ? new Date(t.dueAt) : new Date(t.eventDate);
        return isToday(d);
      }
      if (filter === "week") {
        const d = t.dueAt ? new Date(t.dueAt) : new Date(t.eventDate);
        return d >= now && isBefore(d, weekEnd);
      }
      if (filter === "assigned") return !!t.assignedTo;
      return true;
    });
  }, [allTasks, filter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      // incomplete first
      const aDone = a.checked || a.status === "done" ? 1 : 0;
      const bDone = b.checked || b.status === "done" ? 1 : 0;
      if (aDone !== bDone) return aDone - bDone;

      if (sortKey === "due") {
        const aD = a.dueAt || a.eventDate || "9999";
        const bD = b.dueAt || b.eventDate || "9999";
        return new Date(aD).getTime() - new Date(bD).getTime();
      }
      if (sortKey === "binder") return a.binderTitle.localeCompare(b.binderTitle);
      if (sortKey === "assigned") return (a.assignedTo || "zzz").localeCompare(b.assignedTo || "zzz");
      return 0;
    });
    return arr;
  }, [filtered, sortKey]);

  const updateTaskStatus = useCallback((t: TaskRow, newStatus: ChecklistStatus) => {
    try {
      const raw = localStorage.getItem(`mako-binder-${t.binderId}`);
      if (!raw) return;
      const state = JSON.parse(raw);
      state.checklist = state.checklist.map((c: any) =>
        c.id === t.rawId ? { ...c, checked: newStatus === "done", status: newStatus } : c
      );
      localStorage.setItem(`mako-binder-${t.binderId}`, JSON.stringify(state));
    } catch { /* ignore */ }
  }, []);

  const toggleItem = (t: TaskRow) => {
    const newStatus = (t.checked || t.status === "done") ? "open" : "done";
    updateTaskStatus(t, newStatus);
    bump((n) => n + 1);
  };

  const bulkSetStatus = (status: ChecklistStatus) => {
    const taskMap = new Map<string, TaskRow>();
    for (const t of sorted) {
      if (selected.has(t.id)) taskMap.set(t.id, t);
    }
    taskMap.forEach((t) => updateTaskStatus(t, status));
    setSelected(new Set());
    bump((n) => n + 1);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((t) => t.id)));
    }
  };

  const incompleteCount = allTasks.filter(
    (t) => !t.checked && t.status !== "done" && t.binderStatus !== "archived"
  ).length;

  const filters: { label: string; value: FilterMode }[] = [
    { label: "Incomplete", value: "incomplete" },
    { label: "Due Today", value: "today" },
    { label: "Next 7 Days", value: "week" },
    { label: "Assigned", value: "assigned" },
    { label: "All", value: "all" },
  ];

  const sorts: { label: string; value: SortKey }[] = [
    { label: "Due", value: "due" },
    { label: "Binder", value: "binder" },
    { label: "Assigned", value: "assigned" },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="text-xl font-medium text-foreground tracking-tight">Task Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {incompleteCount} open task{incompleteCount !== 1 ? "s" : ""} across {binderStore.getAll().length} binders
        </p>
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {filters.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
                filter === f.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>{f.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          {sorts.map((s) => (
            <button key={s.value} onClick={() => setSortKey(s.value)}
              className={`px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
                sortKey === s.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 mb-3 px-4 py-2.5 rounded border border-primary/30 bg-primary/5"
          >
            <span className="text-xs text-foreground font-medium">{selected.size} selected</span>
            <div className="flex items-center gap-1.5 ml-2">
              <button onClick={() => bulkSetStatus("open")}
                className="px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
                Open
              </button>
              <button onClick={() => bulkSetStatus("in-progress")}
                className="px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border border-amber-500/40 text-amber-500 hover:bg-amber-500/10 transition-colors">
                In Progress
              </button>
              <button onClick={() => bulkSetStatus("done")}
                className="px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10 transition-colors">
                Done
              </button>
            </div>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}
        className="steel-panel overflow-hidden">
        {sorted.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-10 pr-0">
                  <Checkbox
                    checked={sorted.length > 0 && selected.size === sorted.length}
                    onCheckedChange={toggleSelectAll}
                    className="border-muted-foreground/50"
                  />
                </TableHead>
                <TableHead className="w-8"></TableHead>
                <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Task</TableHead>
                <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Assigned To</TableHead>
                <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Due</TableHead>
                <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Binder</TableHead>
                <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((t) => {
                const isDone = t.checked || t.status === "done";
                const isSelected = selected.has(t.id);
                return (
                  <TableRow key={t.id} className={`border-border group ${isSelected ? "bg-primary/5" : ""}`}>
                    <TableCell className="w-10 pr-0">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(t.id)}
                        className="border-muted-foreground/50"
                      />
                    </TableCell>
                    <TableCell className="w-8 pr-0">
                      <button onClick={() => toggleItem(t)} className="p-0.5">
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
                      <Link to={`/binders/${t.binderId}#checklist`}
                        className="text-sm text-primary hover:underline underline-offset-2">
                        {t.binderTitle}
                      </Link>
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
        ) : (
          <div className="px-6 py-12 text-center">
            <CheckSquare className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === "incomplete" ? "All tasks complete." : "No tasks match this filter."}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
