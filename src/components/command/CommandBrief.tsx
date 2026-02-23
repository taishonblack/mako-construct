import { motion } from "framer-motion";
import { Zap, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import type { ReadinessReport } from "@/lib/readiness-engine";
import type { Issue, ChangeEntry } from "@/data/mock-phase5";
import type { ChecklistItem } from "@/hooks/use-binder-state";

interface CommandBriefProps {
  venue: string;
  partner: string;
  isoCount: number;
  report: ReadinessReport;
  issues: Issue[];
  changes: ChangeEntry[];
  checklist: ChecklistItem[];
}

function Stat({ label, value, alert }: { label: string; value: string | number; alert?: boolean }) {
  return (
    <div>
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">{label}</span>
      <span className={`text-sm font-mono ${alert ? "text-crimson" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

export function CommandBrief({ venue, partner, isoCount, report, issues, changes, checklist }: CommandBriefProps) {
  const blockingIssues = issues.filter((i) => i.status !== "resolved" && i.priority === "high").length;
  const openIssues = issues.filter((i) => i.status !== "resolved").length;
  const checklistDone = checklist.filter((c) => c.checked).length;
  const lastChange = changes.length > 0 ? changes[0].timestamp : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Command Brief</h2>
      <div className="steel-panel p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
          <Stat label="Venue" value={venue} />
          <Stat label="Partner" value={partner} />
          <Stat label="ISO Count" value={isoCount} />
          <Stat
            label="Encoder Status"
            value={report.encoderShortfall > 0 ? `${report.encoderShortfall} short` : "✓ Allocated"}
            alert={report.encoderShortfall > 0}
          />
          <Stat
            label="Transport"
            value={report.transportComplete ? (report.backupDefined ? "✓ Pri + Bak" : "⚠ No Backup") : "✗ Incomplete"}
            alert={!report.transportComplete}
          />
          <Stat
            label="Return Feed"
            value={report.returnConfigured ? "✓ Configured" : "✗ Missing"}
            alert={!report.returnConfigured}
          />
          <Stat
            label="Checklist"
            value={`${checklistDone}/${checklist.length}`}
            alert={checklistDone < checklist.length}
          />
          <Stat
            label="Open Issues"
            value={openIssues}
            alert={blockingIssues > 0}
          />
          <Stat
            label="Blocking"
            value={blockingIssues}
            alert={blockingIssues > 0}
          />
          {lastChange && (
            <div>
              <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-1">Last Update</span>
              <span className="text-xs text-muted-foreground">
                {new Date(lastChange).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
