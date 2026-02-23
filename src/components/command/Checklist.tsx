import { motion } from "framer-motion";
import { CheckSquare, Square } from "lucide-react";
import type { ChecklistItem } from "@/hooks/use-binder-state";

interface ChecklistProps {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
}

export function Checklist({ items, onToggle }: ChecklistProps) {
  const done = items.filter((i) => i.checked).length;
  const total = items.length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Checklist</h2>
        <span className={`text-[10px] font-mono ${done === total ? "text-emerald-400" : "text-muted-foreground"}`}>
          {done}/{total}
        </span>
        {/* Progress bar */}
        <div className="flex-1 max-w-32 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-crimson rounded-full transition-all duration-300"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      </div>

      <div className="steel-panel p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-secondary/50 transition-colors text-left group"
            >
              {item.checked ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
              )}
              <span className={`text-sm ${item.checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
