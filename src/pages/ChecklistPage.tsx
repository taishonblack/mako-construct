import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckSquare, Square, ChevronRight, Filter } from "lucide-react";
import { format, isToday, addDays, isBefore } from "date-fns";
import { binderStore } from "@/stores/binder-store";

interface AggregatedChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  binderId: string;
  binderTitle: string;
  eventDate: string;
  binderStatus: string;
}

function loadChecklistsFromBinders(): AggregatedChecklistItem[] {
  const binders = binderStore.getAll();
  const items: AggregatedChecklistItem[] = [];

  for (const binder of binders) {
    try {
      const raw = localStorage.getItem(`mako-binder-${binder.id}`);
      if (!raw) continue;
      const state = JSON.parse(raw);
      if (!state.checklist) continue;
      for (const item of state.checklist) {
        items.push({
          id: `${binder.id}-${item.id}`,
          label: item.label,
          checked: item.checked,
          binderId: binder.id,
          binderTitle: binder.title,
          eventDate: binder.eventDate,
          binderStatus: binder.status,
        });
      }
    } catch { /* ignore */ }
  }

  return items;
}

type FilterMode = "all" | "today" | "week" | "incomplete";

export default function ChecklistPage() {
  const [filter, setFilter] = useState<FilterMode>("incomplete");
  const [, forceUpdate] = useState(0);

  const allItems = useMemo(() => loadChecklistsFromBinders(), [filter]);

  const filtered = useMemo(() => {
    const now = new Date();
    const weekEnd = addDays(now, 7);
    return allItems.filter((item) => {
      // Only show items from active binders (and drafts for the creator)
      if (item.binderStatus === "archived") return false;
      if (filter === "incomplete" && item.checked) return false;
      if (filter === "today" && !isToday(new Date(item.eventDate))) return false;
      if (filter === "week" && !isBefore(new Date(item.eventDate), weekEnd)) return false;
      return true;
    }).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
  }, [allItems, filter]);

  // Group by binder
  const grouped = useMemo(() => {
    const map = new Map<string, AggregatedChecklistItem[]>();
    for (const item of filtered) {
      if (!map.has(item.binderId)) map.set(item.binderId, []);
      map.get(item.binderId)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const toggleItem = (binderId: string, itemId: string) => {
    try {
      const raw = localStorage.getItem(`mako-binder-${binderId}`);
      if (!raw) return;
      const state = JSON.parse(raw);
      state.checklist = state.checklist.map((c: any) =>
        c.id === itemId ? { ...c, checked: !c.checked } : c
      );
      localStorage.setItem(`mako-binder-${binderId}`, JSON.stringify(state));
      forceUpdate((n) => n + 1);
    } catch { /* ignore */ }
  };

  const filters: { label: string; value: FilterMode }[] = [
    { label: "Incomplete", value: "incomplete" },
    { label: "Today", value: "today" },
    { label: "Next 7 Days", value: "week" },
    { label: "All", value: "all" },
  ];

  const incompleteCount = allItems.filter((i) => !i.checked && i.binderStatus !== "archived").length;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-8">
        <h1 className="text-xl font-medium text-foreground tracking-tight">Checklist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {incompleteCount} incomplete task{incompleteCount !== 1 ? "s" : ""} across {binderStore.getAll().length} binders
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        {filters.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border transition-colors ${
              filter === f.value ? "border-crimson bg-crimson/10 text-crimson" : "border-border text-muted-foreground hover:text-foreground"
            }`}>{f.label}</button>
        ))}
      </div>

      {/* Grouped checklist */}
      <div className="space-y-4">
        {grouped.map(([binderId, items], gi) => (
          <motion.div key={binderId} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + gi * 0.05 }}
            className="steel-panel overflow-hidden">
            <Link to={`/binders/${binderId}`}
              className="flex items-center justify-between px-5 py-3 border-b border-border hover:bg-secondary/50 transition-colors group">
              <div>
                <h3 className="text-sm font-medium text-foreground group-hover:text-foreground">{items[0].binderTitle}</h3>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(items[0].eventDate), "EEE, MMM d")} · {items.filter((i) => i.checked).length}/{items.length} complete
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
            <div className="divide-y divide-border">
              {items.map((item) => {
                const realId = item.id.split("-").slice(1).join("-");
                return (
                  <button key={item.id} onClick={() => toggleItem(binderId, realId)}
                    className="flex items-center gap-3 px-5 py-2.5 w-full text-left hover:bg-secondary/30 transition-colors">
                    {item.checked
                      ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      : <Square className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <span className={`text-sm ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {grouped.length === 0 && (
          <div className="steel-panel px-6 py-12 text-center">
            <CheckSquare className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === "incomplete" ? "All tasks complete!" : "No checklist items found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
