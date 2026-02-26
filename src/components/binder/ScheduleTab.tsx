import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ScheduleItem } from "@/lib/binder-types";

const typeStyles: Record<ScheduleItem["type"], { dot: string; line: string }> = {
  milestone: { dot: "bg-crimson", line: "border-crimson/40" },
  segment: { dot: "bg-muted-foreground", line: "border-border" },
  break: { dot: "bg-muted-foreground/50", line: "border-border/50" },
};

export function ScheduleTab({ schedule }: { schedule: ScheduleItem[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="steel-panel p-5 mt-4">
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[23px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-0">
          {schedule.map((item, i) => {
            const isOpen = expanded === item.id;
            const style = typeStyles[item.type];

            return (
              <button
                key={item.id}
                onClick={() => setExpanded(isOpen ? null : item.id)}
                className="relative flex items-start gap-4 w-full text-left py-3 px-1 hover:bg-secondary/50 rounded transition-colors"
              >
                {/* Time */}
                <span className="text-xs font-mono text-muted-foreground w-10 shrink-0 pt-0.5 text-right">
                  {item.time}
                </span>

                {/* Dot */}
                <div className={`w-2.5 h-2.5 rounded-full ${style.dot} shrink-0 mt-1 z-10`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${item.type === "milestone" ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {item.label}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                  {isOpen && (
                    <p className="text-xs text-muted-foreground mt-1.5">{item.detail}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
