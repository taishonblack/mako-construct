import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, Shield, ShieldAlert, AlertTriangle } from "lucide-react";
import type { ReadinessReport, ReadinessLevel } from "@/lib/readiness-engine";
import type { LockState, LockSnapshot } from "@/hooks/use-binder-state";

interface PreAirLockProps {
  lockState: LockState;
  lockHistory: LockSnapshot[];
  report: ReadinessReport;
  onLock: () => void;
  onUnlock: (reason: string) => void;
}

function canLock(report: ReadinessReport): { allowed: boolean; blockers: string[] } {
  const blockers: string[] = [];
  if (report.encoderShortfall > 0) blockers.push(`Encoder shortfall: ${report.encoderShortfall} inputs missing`);
  if (!report.transportComplete) blockers.push("Primary transport not configured");
  if (!report.returnConfigured) blockers.push("Return feed required but not configured");
  if (report.blockingIssues > 0) blockers.push(`${report.blockingIssues} blocking issue(s) open`);
  // Checklist: require at least the critical items
  const requiredChecklist = report.checklistTotal > 0 && report.checklistComplete < Math.ceil(report.checklistTotal * 0.5);
  if (requiredChecklist) blockers.push(`Checklist: only ${report.checklistComplete}/${report.checklistTotal} complete (need ≥50%)`);
  return { allowed: blockers.length === 0, blockers };
}

export function PreAirLock({ lockState, lockHistory, report, onLock, onUnlock }: PreAirLockProps) {
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState("");
  const { allowed, blockers } = canLock(report);

  const handleUnlock = () => {
    if (unlockReason.trim()) {
      onUnlock(unlockReason.trim());
      setUnlockReason("");
      setUnlockOpen(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Pre-Air Lock</h2>
      <div className="steel-panel p-5 space-y-4">
        {/* Current status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {lockState.locked ? (
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">Locked</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  v{lockState.version} — {lockState.lockedAt ? new Date(lockState.lockedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Unlocked</span>
                {lockState.version > 0 && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    (last lock: v{lockState.version})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action button */}
          {lockState.locked ? (
            <div className="flex items-center gap-2">
              {!unlockOpen ? (
                <button
                  onClick={() => setUnlockOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider uppercase border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-crimson transition-colors"
                >
                  <Unlock className="w-3 h-3" />
                  Unlock
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={unlockReason}
                    onChange={(e) => setUnlockReason(e.target.value)}
                    placeholder="Reason for unlock…"
                    onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                    className="text-sm bg-secondary border border-border rounded-sm px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-crimson transition-colors w-56"
                    autoFocus
                  />
                  <button onClick={handleUnlock} disabled={!unlockReason.trim()}
                    className="px-3 py-1.5 text-[10px] tracking-wider uppercase bg-crimson/10 border border-crimson/40 text-crimson rounded-sm hover:bg-crimson/20 transition-colors disabled:opacity-40">
                    Confirm
                  </button>
                  <button onClick={() => { setUnlockOpen(false); setUnlockReason(""); }}
                    className="px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground">Cancel</button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLock}
              disabled={!allowed}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider uppercase rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-900/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/30"
            >
              <Lock className="w-3 h-3" />
              Lock Production
            </button>
          )}
        </div>

        {/* Blockers (when not locked and can't lock) */}
        {!lockState.locked && !allowed && (
          <div className="space-y-1.5 p-3 rounded bg-crimson/5 border border-crimson/20">
            <span className="text-[10px] tracking-wider uppercase text-crimson flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Cannot lock — resolve these first
            </span>
            {blockers.map((b, i) => (
              <p key={i} className="text-[11px] text-muted-foreground pl-4">• {b}</p>
            ))}
          </div>
        )}

        {/* Lock history */}
        {lockHistory.length > 0 && (
          <div>
            <span className="text-[10px] tracking-wider uppercase text-muted-foreground block mb-2">Lock History</span>
            <div className="space-y-1">
              {lockHistory.slice(0, 5).map((snap) => (
                <div key={snap.id} className="flex items-center gap-3 text-[11px] text-muted-foreground p-2 rounded bg-secondary/30">
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="font-mono">{snap.id}</span>
                  <span>{new Date(snap.lockedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <span>by {snap.lockedBy}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
