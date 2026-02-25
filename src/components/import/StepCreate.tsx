import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import type { CallSheetExtraction, ImportPlan, ImportCreateItem } from "@/lib/import-types";

interface Props {
  extraction: CallSheetExtraction;
  plan: ImportPlan;
  items: ImportCreateItem[];
  onToggle: (index: number) => void;
}

export function StepCreate({ extraction, plan, items, onToggle }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([0]));

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const enabledCount = items.filter(i => i.enabled).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          This import will create <span className="text-foreground font-medium">{enabledCount}</span> object{enabledCount !== 1 ? "s" : ""}
        </p>
      </div>

      {items.map((item, i) => {
        const isOpen = expanded.has(i);
        return (
          <div key={i} className="steel-panel overflow-hidden">
            <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => toggle(i)}>
              <Checkbox
                checked={item.enabled}
                onCheckedChange={() => onToggle(i)}
                onClick={(e) => e.stopPropagation()}
              />
              {isOpen
                ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
              }
              <span className="text-sm font-medium text-foreground flex-1 min-w-0">{item.label}</span>
              <Badge variant="outline" className="text-[9px] shrink-0">{item.type}</Badge>
            </div>
            {isOpen && item.details.length > 0 && (
              <div className="px-4 pb-3 pl-11">
                <ul className="space-y-1">
                  {item.details.map((d, j) => (
                    <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
