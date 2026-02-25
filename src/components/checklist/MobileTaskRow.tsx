import { useState, useRef, useEffect } from "react";
import { CheckSquare, Trash2, UserPlus, CalendarClock } from "lucide-react";
import { format, endOfDay } from "date-fns";
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

interface MobileTaskRowProps {
  item: ChecklistItem;
  onUpdate: (id: string, patch: Partial<ChecklistItem>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onAssignMe: (id: string) => void;
  readOnly?: boolean;
}

export function MobileTaskRow({ item, onUpdate, onRemove, onToggle, onAssignMe, readOnly }: MobileTaskRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const isDone = item.checked || item.status === "done";

  useEffect(() => {
    if (!statusOpen) return;
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [statusOpen]);

  return (
    <div className="w-full max-w-full overflow-hidden border-b border-border last:border-b-0">
      {/* Main row */}
      <div className="flex items-start gap-3 px-3 py-3 min-w-0">
        {/* Checkbox */}
        <button onClick={() => onToggle(item.id)} disabled={readOnly} className="shrink-0 mt-0.5">
          {isDone ? (
            <CheckSquare className="w-4 h-4 text-emerald-500" />
          ) : (
            <div className="w-4 h-4 border border-muted-foreground/50 rounded-sm" />
          )}
        </button>

        {/* Content — tappable to expand */}
        <button
          onClick={() => !readOnly && setExpanded(!expanded)}
          className="flex-1 min-w-0 text-left"
        >
          <span className={`text-sm leading-snug block ${isDone ? "text-muted-foreground line-through" : "text-foreground"}`}>
            {item.label}
          </span>
          {/* Stacked meta below title */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {item.assignedTo ? (
              <span className="text-[10px] text-muted-foreground">{item.assignedTo}</span>
            ) : (
              <span className="text-[10px] text-muted-foreground/50 italic">Unassigned</span>
            )}
            {item.dueAt && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {format(new Date(item.dueAt), "MMM d, HH:mm")}
              </span>
            )}
          </div>
        </button>

        {/* Status pill */}
        <div className="shrink-0 mt-0.5">
          <Badge variant="outline" className={`text-[9px] tracking-wider uppercase font-medium ${STATUS_STYLE[item.status] || STATUS_STYLE.open}`}>
            {item.status === "in-progress" ? "IP" : item.status === "done" ? "✓" : "○"}
          </Badge>
        </div>
      </div>

      {/* Expanded edit panel */}
      {expanded && !readOnly && (
        <div className="px-3 pb-3 space-y-2">
          <div className="space-y-2 pl-7">
            {/* Status */}
            <div className="relative" ref={statusRef}>
              <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Status</label>
              <button onClick={() => setStatusOpen(!statusOpen)}>
                <Badge variant="outline" className={`text-[9px] tracking-wider uppercase font-medium cursor-pointer ${STATUS_STYLE[item.status] || STATUS_STYLE.open}`}>
                  {item.status === "in-progress" ? "In Progress" : item.status}
                </Badge>
              </button>
              {statusOpen && (
                <div className="absolute z-20 top-full mt-1 left-0 bg-secondary border border-border rounded-sm shadow-lg py-1 min-w-[120px]">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onUpdate(item.id, { status: opt.value, checked: opt.value === "done" });
                        setStatusOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors ${
                        item.status === opt.value ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned */}
            <div>
              <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Assigned To</label>
              <div className="flex items-center gap-2">
                <Input
                  value={item.assignedTo}
                  onChange={(e) => onUpdate(item.id, { assignedTo: e.target.value })}
                  placeholder="Name…"
                  className="h-8 text-xs flex-1 min-w-0"
                />
                <button
                  onClick={() => onAssignMe(item.id)}
                  className="flex items-center gap-1 text-[9px] tracking-wider uppercase text-primary hover:text-foreground shrink-0"
                >
                  <UserPlus className="w-3 h-3" /> Me
                </button>
              </div>
            </div>

            {/* Due */}
            <div>
              <label className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground block mb-1">Due</label>
              <div className="flex items-center gap-2">
                <Input
                  type="datetime-local"
                  value={item.dueAt}
                  onChange={(e) => onUpdate(item.id, { dueAt: e.target.value })}
                  className="h-8 text-xs font-mono flex-1 min-w-0"
                />
                {!item.dueAt && (
                  <button
                    onClick={() => onUpdate(item.id, { dueAt: endOfDay(new Date()).toISOString() })}
                    className="flex items-center gap-1 text-[9px] tracking-wider uppercase text-primary hover:text-foreground shrink-0"
                  >
                    <CalendarClock className="w-3 h-3" /> Today
                  </button>
                )}
              </div>
            </div>

            {/* Remove */}
            <button
              onClick={() => onRemove(item.id)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors mt-1"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
