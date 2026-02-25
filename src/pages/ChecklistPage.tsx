import { useState, useMemo, useCallback, useEffect, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, CheckSquare, ChevronDown, ChevronRight, ChevronsUpDown, User, X } from "lucide-react";
import { format, isToday, addDays, isBefore, isPast } from "date-fns";
import { binderStore } from "@/stores/binder-store";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChecklistTable } from "@/components/checklist/ChecklistTable";
import { SaveBar } from "@/components/checklist/SaveBar";
import { useDisplayName } from "@/hooks/use-display-name";
import { teamStore } from "@/stores/team-store";
import type { ChecklistItem, ChecklistStatus } from "@/hooks/use-binder-state";

interface BinderGroup {
  binderId: string;
  binderTitle: string;
  eventDate: string;
  binderStatus: string;
  tasks: ChecklistItem[];
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
      const tasks: ChecklistItem[] = state.checklist.map((item: any) => ({
        id: item.id,
        label: item.label,
        checked: item.checked,
        assignedTo: item.assignedTo || "",
        dueAt: item.dueAt || "",
        createdAt: item.createdAt || "",
        status: item.status || (item.checked ? "done" : "open"),
        notes: item.notes || "",
      }));
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

function computeCounts(tasks: ChecklistItem[]) {
  const open = tasks.filter(t => !t.checked && t.status !== "done").length;
  const dueToday = tasks.filter(t => t.dueAt && isToday(new Date(t.dueAt)) && t.status !== "done").length;
  const overdue = tasks.filter(t => t.dueAt && isPast(new Date(t.dueAt)) && !isToday(new Date(t.dueAt)) && t.status !== "done").length;
  const unassigned = tasks.filter(t => !t.assignedTo && t.status !== "done").length;
  return { open, dueToday, overdue, unassigned };
}

type FilterMode = "all" | "today" | "week" | "incomplete" | "assigned";

const BINDER_STATUS_STYLE: Record<string, string> = {
  draft: "border-muted-foreground/40 text-muted-foreground",
  active: "border-primary/40 text-primary bg-primary/10",
  complete: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
  archived: "border-muted-foreground/30 text-muted-foreground/60",
};

export default function ChecklistPage() {
  const [filter, setFilter] = useState<FilterMode>("incomplete");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { displayName, setDisplayName } = useDisplayName();
  const [namePrompt, setNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");

  // Saved state from localStorage — savedVersion triggers reload after save
  const [savedVersion, bumpVersion] = useState(0);
  const savedGroups = useMemo(() => loadGroups(), [savedVersion]);

  // Draft state per binder
  const [drafts, setDrafts] = useState<Record<string, ChecklistItem[]>>(() => {
    const d: Record<string, ChecklistItem[]> = {};
    for (const g of loadGroups()) {
      d[g.binderId] = [...g.tasks];
    }
    return d;
  });

  // Refresh drafts when saved groups change (after save)
  useEffect(() => {
    setDrafts((prev) => {
      const next: Record<string, ChecklistItem[]> = {};
      for (const g of savedGroups) {
        // Only update if no local draft changes exist
        if (!prev[g.binderId] || JSON.stringify(prev[g.binderId]) === JSON.stringify(g.tasks)) {
          next[g.binderId] = [...g.tasks];
        } else {
          next[g.binderId] = prev[g.binderId];
        }
      }
      return next;
    });
  }, [savedGroups]);

  // Dirty tracking
  const dirtyBinders = useMemo(() => {
    const dirty = new Set<string>();
    for (const g of savedGroups) {
      const draft = drafts[g.binderId];
      if (draft && JSON.stringify(draft) !== JSON.stringify(g.tasks)) {
        dirty.add(g.binderId);
      }
    }
    return dirty;
  }, [savedGroups, drafts]);

  const isDirty = dirtyBinders.size > 0;

  // beforeunload
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const updateDraft = useCallback((binderId: string, items: ChecklistItem[]) => {
    setDrafts((prev) => ({ ...prev, [binderId]: items }));
  }, []);

  const saveAll = useCallback(() => {
    // Write all dirty binder checklists to localStorage
    for (const [binderId, draftItems] of Object.entries(drafts)) {
      try {
        const raw = localStorage.getItem(`mako-binder-${binderId}`);
        if (!raw) continue;
        const state = JSON.parse(raw);
        if (JSON.stringify(state.checklist) !== JSON.stringify(draftItems)) {
          state.checklist = draftItems;
          localStorage.setItem(`mako-binder-${binderId}`, JSON.stringify(state));
        }
      } catch { /* ignore */ }
    }
    // Bump version to reload savedGroups from localStorage
    bumpVersion((n) => n + 1);
  }, [drafts]);

  const discardAll = useCallback(() => {
    const d: Record<string, ChecklistItem[]> = {};
    for (const g of savedGroups) {
      d[g.binderId] = [...g.tasks];
    }
    setDrafts(d);
  }, [savedGroups]);

  // Collect unique assignee names from all tasks
  const assigneeNames = useMemo(() => {
    const names = new Set<string>();
    for (const g of savedGroups) {
      const tasks = drafts[g.binderId] || g.tasks;
      for (const t of tasks) {
        if (t.assignedTo) names.add(t.assignedTo);
      }
    }
    return Array.from(names).sort();
  }, [savedGroups, drafts]);

  const filterTask = useCallback((t: ChecklistItem) => {
    if (assigneeFilter && t.assignedTo !== assigneeFilter) return false;
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
  }, [filter, assigneeFilter]);

  // Build visible groups using draft data
  const visibleGroups = useMemo(() => {
    return savedGroups
      .filter(g => g.binderStatus !== "archived")
      .map(g => {
        const draftTasks = drafts[g.binderId] || g.tasks;
        const filtered = draftTasks.filter(t => filterTask(t)).sort((a, b) => {
          const aDone = a.status === "done" ? 1 : 0;
          const bDone = b.status === "done" ? 1 : 0;
          if (aDone !== bDone) return aDone - bDone;
          const aD = a.dueAt || "9999";
          const bD = b.dueAt || "9999";
          return new Date(aD).getTime() - new Date(bD).getTime();
        });
        return { ...g, tasks: draftTasks, filteredTasks: filtered, counts: computeCounts(draftTasks) };
      })
      .filter(g => g.filteredTasks.length > 0);
  }, [savedGroups, drafts, filterTask]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (expanded.size > 0) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(visibleGroups.map(g => g.binderId)));
    }
  };

  const totalOpen = visibleGroups.reduce((s, g) => s + g.counts.open, 0);

  const filters: { label: string; value: FilterMode }[] = [
    { label: "Incomplete", value: "incomplete" },
    { label: "Due Today", value: "today" },
    { label: "Next 7 Days", value: "week" },
    { label: "Assigned", value: "assigned" },
    { label: "All", value: "all" },
  ];

  const handlePromptDisplayName = () => {
    setNamePrompt(true);
    setNameInput(displayName);
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      setDisplayName(nameInput.trim());
    }
    setNamePrompt(false);
  };

  return (
    <div className="pb-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-6">
        <h1 className="text-xl font-medium text-foreground tracking-tight">Task Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalOpen} open task{totalOpen !== 1 ? "s" : ""} across {savedGroups.length} binder{savedGroups.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Display name prompt */}
      {namePrompt && (
        <div className="mb-4 p-3 bg-secondary/50 rounded-sm border border-border flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Set your name for assignments:</span>
          <Input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name…"
            className="h-8 text-sm max-w-48"
            onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            autoFocus
          />
          <button onClick={handleSaveName} className="px-3 py-1.5 text-[10px] tracking-wider uppercase bg-primary text-primary-foreground rounded-sm">
            Save Name
          </button>
          <button onClick={() => setNamePrompt(false)} className="px-3 py-1.5 text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3">
        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {filters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`px-2 md:px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
                filter === f.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}>{f.label}</button>
          ))}
        </div>
        <button onClick={toggleAll} className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ChevronsUpDown className="w-3 h-3" />
          {expanded.size > 0 ? "Collapse All" : "Expand All"}
        </button>
      </div>

      {/* Assignee filter row */}
      <div className="flex items-center gap-1.5 md:gap-2 mb-5 flex-wrap">
        <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {displayName && (
          <button onClick={() => setAssigneeFilter(assigneeFilter === displayName ? "" : displayName)}
            className={`px-2 md:px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors font-medium ${
              assigneeFilter === displayName ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}>⚡ My Tasks</button>
        )}
        <button onClick={() => setAssigneeFilter("")}
          className={`px-2 md:px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
            !assigneeFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
          }`}>Anyone</button>
        {assigneeNames.filter(n => n !== displayName).map(name => (
          <button key={name} onClick={() => setAssigneeFilter(name)}
            className={`px-2 md:px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
              assigneeFilter === name ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            }`}>{name}</button>
        ))}
        {assigneeFilter && (
          <button onClick={() => setAssigneeFilter("")} className="ml-1 p-0.5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Binder groups */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {visibleGroups.length > 0 ? visibleGroups.map(g => {
            const isOpen = expanded.has(g.binderId);
            const dirty = dirtyBinders.has(g.binderId);
            return (
              <motion.div key={g.binderId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className={`steel-panel overflow-hidden ${dirty ? "ring-1 ring-primary/30" : ""}`}>
                {/* Binder header */}
                <button onClick={() => toggleExpand(g.binderId)}
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
                      {dirty && (
                        <span className="text-[9px] tracking-wider uppercase text-primary">● modified</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {format(new Date(g.eventDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 text-[10px] tracking-wider uppercase shrink-0 flex-wrap">
                    <span className="text-muted-foreground">{g.counts.open} open</span>
                    {g.counts.dueToday > 0 && <span className="text-primary">{g.counts.dueToday} today</span>}
                    {g.counts.overdue > 0 && <span className="text-destructive">{g.counts.overdue} overdue</span>}
                    {g.counts.unassigned > 0 && <span className="text-muted-foreground/60 hidden md:inline">{g.counts.unassigned} unassigned</span>}
                  </div>
                </button>

                {/* Task table */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <ChecklistTable
                        items={drafts[g.binderId] || g.tasks}
                        onChange={(items) => updateDraft(g.binderId, items)}
                        readOnly={false}
                        displayName={displayName}
                        onPromptDisplayName={handlePromptDisplayName}
                      />
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

      {/* Save bar */}
      <SaveBar isDirty={isDirty} onSave={saveAll} onDiscard={discardAll} />

    </div>
  );
}
