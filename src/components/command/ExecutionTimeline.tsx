import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, Loader2 } from "lucide-react";

export interface Milestone {
  id: string;
  label: string;
  time: string;
  status: "pending" | "in-progress" | "complete";
  requiresConfig?: boolean;
}

const defaultMilestones: Milestone[] = [
  { id: "m1", label: "Fax / Configuration Sent", time: "T-72h", status: "complete" },
  { id: "m2", label: "Validation", time: "T-24h", status: "complete" },
  { id: "m3", label: "Transmission Check-in", time: "T-4h", status: "in-progress", requiresConfig: true },
  { id: "m4", label: "Live", time: "T-0", status: "pending", requiresConfig: true },
  { id: "m5", label: "Release / Teardown", time: "T+2h", status: "pending" },
];

const statusIcon = {
  pending: { icon: Clock, cls: "text-muted-foreground" },
  "in-progress": { icon: Loader2, cls: "text-amber-400 animate-spin" },
  complete: { icon: CheckCircle, cls: "text-emerald-400" },
};

export function ExecutionTimeline() {
  const [milestones] = useState<Milestone[]>(defaultMilestones);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Execution Timeline</h2>
      <div className="steel-panel p-5">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

          <div className="space-y-4">
            {milestones.map((m) => {
              const { icon: Icon, cls } = statusIcon[m.status];
              return (
                <div key={m.id} className="relative flex items-center gap-4">
                  <div className="z-10 bg-card">
                    <Icon className={`w-[18px] h-[18px] ${cls}`} />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <span className={`text-sm ${m.status === "complete" ? "text-muted-foreground" : "text-foreground"}`}>
                        {m.label}
                      </span>
                      {m.requiresConfig && m.status !== "complete" && (
                        <span className="ml-2 text-[10px] text-amber-400 tracking-wider uppercase">requires config</span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{m.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
