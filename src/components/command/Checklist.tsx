import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Square, Plus, Trash2, Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import type { ChecklistItem, ChecklistStatus } from "@/hooks/use-binder-state";
import { Input } from "@/components/ui/input";
import { TeamMemberSelect } from "@/components/TeamMemberSelect";
import { cn } from "@/lib/utils";

interface ChecklistProps {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  onAddItem?: (item: Omit<ChecklistItem, "id" | "createdAt">) => void;
  onUpdateItem?: (id: string, patch: Partial<ChecklistItem>) => void;
  onRemoveItem?: (id: string) => void;
  readOnly?: boolean;
}

const STATUS_OPTIONS: { value: ChecklistStatus; label: string; color: string }[] = [
  { value: "open", label: "Open", color: "text-muted-foreground" },
  { value: "in-progress", label: "In Progress", color: "text-amber-500" },
  { value: "done", label: "Done", color: "text-emerald-500" },
];

export function Checklist({ items, onToggle, onAddItem, onUpdateItem, onRemoveItem, readOnly }: ChecklistProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssigned, setNewAssigned] = useState("");
  const [newDue, setNewDue] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const done = items.filter((i) => i.status === "done" || i.checked).length;
  const total = items.length;

  const handleAdd = () => {
    if (!newTitle.trim() || !onAddItem) return;
    onAddItem({
      label: newTitle.trim(),
      checked: false,
      assignedTo: newAssigned,
      dueAt: newDue,
      status: "open",
      notes: "",
    });
    setNewTitle("");
    setNewAssigned("");
    setNewDue("");
    setShowAdd(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Checklist</h2>
        <span className={`text-[10px] font-mono ${done === total ? "text-emerald-500" : "text-muted-foreground"}`}>
          {done}/{total}
        </span>
        <div className="flex-1 max-w-32 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
          />
        </div>
        {!readOnly && onAddItem && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 text-[10px] tracking-wider uppercase text-primary hover:text-foreground transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Task
          </button>
        )}
      </div>

      <div className="steel-panel p-5">
        {/* Add new item form */}
        {showAdd && !readOnly && (
          <div className="mb-4 p-3 bg-secondary/50 rounded-sm border border-border space-y-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title…"
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Assigned To</label>
                <Input
                  value={newAssigned}
                  onChange={(e) => setNewAssigned(e.target.value)}
                  placeholder="Name…"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Due Date</label>
                <Input
                  type="datetime-local"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="h-7 text-xs font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={!newTitle.trim()}
                className="px-3 py-1 text-[10px] tracking-wider uppercase bg-primary text-primary-foreground rounded-sm disabled:opacity-40">
                Add
              </button>
              <button onClick={() => setShowAdd(false)}
                className="px-3 py-1 text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div key={item.id} className="group">
                <div className="flex items-center gap-3 px-3 py-2 rounded hover:bg-secondary/50 transition-colors">
                  <button onClick={() => onToggle(item.id)} disabled={readOnly} className="shrink-0">
                    {item.checked || item.status === "done" ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </button>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="flex-1 text-left"
                  >
                    <span className={`text-sm ${item.checked || item.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {item.label}
                    </span>
                  </button>
                  {/* Meta badges */}
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                    {item.assignedTo && (
                      <span className="flex items-center gap-0.5"><User className="w-2.5 h-2.5" />{item.assignedTo}</span>
                    )}
                    {item.dueAt && (
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{format(new Date(item.dueAt), "MMM d")}</span>
                    )}
                    {item.status !== "open" && item.status !== "done" && (
                      <span className="text-amber-500 uppercase tracking-wider">{item.status}</span>
                    )}
                  </div>
                  {!readOnly && (
                    <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Expanded detail row */}
                {isExpanded && !readOnly && onUpdateItem && (
                  <div className="ml-10 mr-3 mb-2 p-3 bg-secondary/30 rounded-sm border border-border space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Status</label>
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateItem(item.id, { status: e.target.value as ChecklistStatus })}
                          className="w-full text-xs bg-secondary border border-border rounded-sm px-2 py-1 text-foreground"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Assigned To</label>
                        <TeamMemberSelect
                          value={item.assignedTo}
                          onChange={(name, _id) => onUpdateItem(item.id, { assignedTo: name })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Due Date</label>
                        <Input
                          type="datetime-local"
                          value={item.dueAt}
                          onChange={(e) => onUpdateItem(item.id, { dueAt: e.target.value })}
                          className="h-7 text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground">Notes</label>
                      <Input
                        value={item.notes}
                        onChange={(e) => onUpdateItem(item.id, { notes: e.target.value })}
                        className="h-7 text-xs"
                        placeholder="Task notes…"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">
                        Created {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </span>
                      {onRemoveItem && (
                        <button onClick={() => onRemoveItem(item.id)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No checklist items yet.</p>
        )}
      </div>
    </motion.section>
  );
}
