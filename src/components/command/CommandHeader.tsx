import { motion } from "framer-motion";
import type { ReadinessLevel } from "@/lib/readiness-engine";

type EventStatus = "planning" | "configured" | "validated" | "live";

const statusStyles: Record<EventStatus, string> = {
  planning: "bg-muted text-muted-foreground",
  configured: "bg-secondary text-foreground",
  validated: "bg-emerald-900/30 text-emerald-400",
  live: "bg-crimson/20 text-crimson",
};

const readinessConfig: Record<ReadinessLevel, { label: string; dot: string; text: string }> = {
  ready: { label: "Ready", dot: "bg-emerald-400", text: "text-emerald-400" },
  risk: { label: "Risk", dot: "bg-amber-400", text: "text-amber-400" },
  blocked: { label: "Blocked", dot: "bg-crimson", text: "text-crimson" },
};

interface CommandHeaderProps {
  eventName: string;
  status: EventStatus;
  readiness: ReadinessLevel;
  reasons: string[];
}

export function CommandHeader({ eventName, status, readiness, reasons }: CommandHeaderProps) {
  const r = readinessConfig[readiness];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-3"
    >
      <div className="flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-crimson">
            MAKO LIVE
          </span>
          <div className="w-px h-4 bg-border" />
          <h1 className="text-sm font-medium text-foreground tracking-tight">{eventName}</h1>
          <span className={`text-[9px] font-medium tracking-[0.15em] uppercase px-2 py-0.5 rounded ${statusStyles[status]}`}>
            {status}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${r.dot} ${readiness === "blocked" ? "animate-pulse" : ""}`} />
            <span className={`text-xs font-medium tracking-wider uppercase ${r.text}`}>{r.label}</span>
          </div>
          {reasons.length > 0 && readiness !== "ready" && (
            <span className="text-[10px] text-muted-foreground max-w-xs truncate hidden lg:inline">
              {reasons[0]}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
