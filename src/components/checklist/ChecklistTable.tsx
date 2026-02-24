import { useState, useRef, useEffect } from "react";
import { format, endOfDay } from "date-fns";
import { CheckSquare, Plus, Trash2, UserPlus, CalendarClock, CheckCheck } from "lucide-react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { ChecklistItem, ChecklistStatus } from "@/hooks/use-binder-state";

const STATUS_STYLE: Record<string, string> = {
  open: "border-muted-foreground/40 text-muted-foreground",
  "in-progress": "border-amber-500/40 text-amber-500 bg-amber-500/10",
  done: "border-emerald-500/40 text-emerald-500 bg-emerald-500/10",
};

const STATUS_OPTIONS: { value: ChecklistStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

interface EditingCell {
  id: string;
  field: "label" | "assignedTo" | "dueAt";
}

interface ChecklistTableProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  readOnly?: boolean;
  displayName?: string;
  onPromptDisplayName?: () => void;
  showAddTask?: boolean;
}

function InlineInput({
  value,
  onCommit,
  onCancel,
  placeholder,
  type,
}: {
  value: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
  placeholder?: string;
  type?: string;
}) {
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  return (
    <Input
      ref={ref}
      type={type || "text"}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); onCommit(val); }
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onCommit(val)}
      placeholder={placeholder}
      className="h-7 text-sm bg-secondary border-primary/40 focus-visible:ring-primary/30"
    />
  );
}

export function ChecklistTable({
  items,
  onChange,
  readOnly,
  displayName,
  onPromptDisplayName,
  showAddTask,
}: ChecklistTableProps) {
  const [editing, setEditing] = useState<EditingCell | null>(null);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const statusRef = useRef<HTMLDivElement>(null);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!statusDropdown) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setStatusDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusDropdown]);

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    onChange(items.map((c) => c.id === id ? { ...c, ...patch } : c));
  };

  const toggleCheckbox = (id: string) => {
    const item = items.find((c) => c.id === id);
    if (!item) return;
    const newDone = !(item.checked || item.status === "done");
    updateItem(id, {
      checked: newDone,
      status: newDone ? "done" : "open",
    });
  };

  const removeItem = (id: string) => {
    onChange(items.filter((c) => c.id !== id));
  };

  const assignMe = (id: string) => {
    if (!displayName) {
      onPromptDisplayName?.();
      return;
    }
    updateItem(id, { assignedTo: displayName });
  };

  const addItem = () => {
    if (!newTitle.trim()) return;
    const item: ChecklistItem = {
      id: `ck-${Date.now()}`,
      label: newTitle.trim(),
      checked: false,
      assignedTo: "",
      dueAt: "",
      createdAt: new Date().toISOString(),
      status: "open",
      notes: "",
    };
    onChange([...items, item]);
    setNewTitle("");
    setShowAdd(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((t) => t.id)));
    }
  };

  const bulkSetStatus = (status: ChecklistStatus) => {
    onChange(items.map((c) =>
      selected.has(c.id) ? { ...c, status, checked: status === "done" } : c
    ));
    setSelected(new Set());
  };

  const hasSelection = !readOnly && selected.size > 0;

  return (
    <div>
      {showAddTask && !readOnly && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 text-[10px] tracking-wider uppercase text-primary hover:text-foreground transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Task
          </button>
        </div>
      )}

      {showAdd && !readOnly && (
        <div className="mb-3 p-3 bg-secondary/50 rounded-sm border border-border flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title…"
            className="h-8 text-sm flex-1"
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <button onClick={addItem} disabled={!newTitle.trim()}
            className="px-3 py-1.5 text-[10px] tracking-wider uppercase bg-primary text-primary-foreground rounded-sm disabled:opacity-40">
            Add
          </button>
          <button onClick={() => setShowAdd(false)}
            className="px-3 py-1.5 text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </div>
      )}

      {/* Bulk action bar */}
      {hasSelection && (
        <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-secondary/80 border border-border rounded-sm">
          <CheckCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] tracking-wider uppercase text-muted-foreground">
            {selected.size} selected
          </span>
          <button onClick={() => bulkSetStatus("open")}
            className="px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border border-border text-muted-foreground hover:text-foreground transition-colors">
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
          <button onClick={() => {
            if (!displayName) { onPromptDisplayName?.(); return; }
            onChange(items.map((c) => selected.has(c.id) ? { ...c, assignedTo: displayName } : c));
            setSelected(new Set());
          }}
            className="px-2.5 py-1 text-[10px] tracking-wider uppercase rounded border border-primary/40 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1">
            <UserPlus className="w-3 h-3" /> Assign me
          </button>
          <button onClick={() => setSelected(new Set())}
            className="ml-auto text-[10px] tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">
            Clear
          </button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {!readOnly && (
              <TableHead className="w-8 pr-0">
                <button onClick={toggleSelectAll} className="p-0.5">
                  {selected.size === items.length && items.length > 0
                    ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    : <div className="w-3.5 h-3.5 border border-muted-foreground/50 rounded-sm hover:border-foreground transition-colors" />}
                </button>
              </TableHead>
            )}
            <TableHead className="w-8"></TableHead>
            <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Task</TableHead>
            <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Assigned To</TableHead>
            <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Due</TableHead>
            <TableHead className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Status</TableHead>
            {!readOnly && <TableHead className="w-8"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((t) => {
            const isDone = t.checked || t.status === "done";
            const isEditing = (field: string) => editing?.id === t.id && editing?.field === field;
            const isSelected = selected.has(t.id);

            return (
              <TableRow key={t.id} className={`border-border group ${isSelected ? "bg-primary/5" : ""}`}>
                {/* Selection checkbox */}
                {!readOnly && (
                  <TableCell className="w-8 pr-0">
                    <button onClick={() => toggleSelect(t.id)} className="p-0.5">
                      {isSelected
                        ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        : <div className="w-3.5 h-3.5 border border-muted-foreground/50 rounded-sm group-hover:border-foreground transition-colors" />}
                    </button>
                  </TableCell>
                )}
                {/* Done checkbox */}
                <TableCell className="w-8 pr-0">
                  {!readOnly ? (
                    <button onClick={() => toggleCheckbox(t.id)} className="p-0.5">
                      {isDone
                        ? <CheckSquare className="w-4 h-4 text-emerald-500" />
                        : <div className="w-4 h-4 border border-muted-foreground/50 rounded-sm group-hover:border-foreground transition-colors" />}
                    </button>
                  ) : (
                    isDone
                      ? <CheckSquare className="w-4 h-4 text-emerald-500" />
                      : <div className="w-4 h-4 border border-muted-foreground/50 rounded-sm" />
                  )}
                </TableCell>

                {/* Task title */}
                <TableCell className={`text-sm ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {!readOnly && isEditing("label") ? (
                    <InlineInput
                      value={t.label}
                      onCommit={(v) => { updateItem(t.id, { label: v || t.label }); setEditing(null); }}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <span
                      className={!readOnly ? "cursor-text hover:bg-secondary/60 px-1 -mx-1 py-0.5 rounded transition-colors" : ""}
                      onClick={() => !readOnly && setEditing({ id: t.id, field: "label" })}
                    >
                      {t.label}
                    </span>
                  )}
                </TableCell>

                {/* Assigned To */}
                <TableCell className="text-sm">
                  {!readOnly && isEditing("assignedTo") ? (
                    <InlineInput
                      value={t.assignedTo}
                      onCommit={(v) => { updateItem(t.id, { assignedTo: v }); setEditing(null); }}
                      onCancel={() => setEditing(null)}
                      placeholder="Name"
                    />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {t.assignedTo ? (
                        <span
                          className={!readOnly ? "cursor-text hover:bg-secondary/60 px-1 -mx-1 py-0.5 rounded transition-colors text-foreground" : "text-foreground"}
                          onClick={() => !readOnly && setEditing({ id: t.id, field: "assignedTo" })}
                        >
                          {t.assignedTo}
                        </span>
                      ) : (
                        <>
                          <span
                            className={`text-muted-foreground/60 italic ${!readOnly ? "cursor-text" : ""}`}
                            onClick={() => !readOnly && setEditing({ id: t.id, field: "assignedTo" })}
                          >
                            Unassigned
                          </span>
                          {!readOnly && (
                            <button
                              onClick={() => assignMe(t.id)}
                              className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[9px] tracking-wider uppercase text-primary hover:text-foreground transition-all"
                            >
                              <UserPlus className="w-2.5 h-2.5" /> Assign me
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Due */}
                <TableCell className="text-sm font-mono text-muted-foreground">
                  {!readOnly && isEditing("dueAt") ? (
                    <div className="flex items-center gap-1">
                      <InlineInput
                        value={t.dueAt}
                        onCommit={(v) => { updateItem(t.id, { dueAt: v }); setEditing(null); }}
                        onCancel={() => setEditing(null)}
                        type="datetime-local"
                      />
                      {t.dueAt && (
                        <button
                          onClick={() => { updateItem(t.id, { dueAt: "" }); setEditing(null); }}
                          className="text-[9px] text-muted-foreground hover:text-destructive shrink-0"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={!readOnly ? "cursor-text hover:bg-secondary/60 px-1 -mx-1 py-0.5 rounded transition-colors" : ""}
                        onClick={() => !readOnly && setEditing({ id: t.id, field: "dueAt" })}
                      >
                        {t.dueAt ? format(new Date(t.dueAt), "MMM d, HH:mm") : "—"}
                      </span>
                      {!readOnly && !t.dueAt && (
                        <button
                          onClick={() => updateItem(t.id, { dueAt: endOfDay(new Date()).toISOString() })}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[9px] tracking-wider uppercase text-primary hover:text-foreground transition-all"
                        >
                          <CalendarClock className="w-2.5 h-2.5" /> Due today
                        </button>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell className="relative">
                  {!readOnly ? (
                    <div ref={statusDropdown === t.id ? statusRef : undefined} className="relative">
                      <button onClick={() => setStatusDropdown(statusDropdown === t.id ? null : t.id)}>
                        <Badge variant="outline"
                          className={`text-[9px] tracking-wider uppercase font-medium cursor-pointer ${STATUS_STYLE[t.status] || STATUS_STYLE.open}`}>
                          {t.status === "in-progress" ? "In Progress" : t.status}
                        </Badge>
                      </button>
                      {statusDropdown === t.id && (
                        <div className="absolute z-20 top-full mt-1 left-0 bg-secondary border border-border rounded-sm shadow-lg py-1 min-w-[120px]">
                          {STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => {
                                updateItem(t.id, {
                                  status: opt.value,
                                  checked: opt.value === "done",
                                });
                                setStatusDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${
                                t.status === opt.value ? "text-foreground font-medium" : "text-muted-foreground"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Badge variant="outline"
                      className={`text-[9px] tracking-wider uppercase font-medium ${STATUS_STYLE[t.status] || STATUS_STYLE.open}`}>
                      {t.status === "in-progress" ? "In Progress" : t.status}
                    </Badge>
                  )}
                </TableCell>

                {/* Remove */}
                {!readOnly && (
                  <TableCell className="w-8">
                    <button
                      onClick={() => removeItem(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No checklist items.</p>
      )}
    </div>
  );
}
