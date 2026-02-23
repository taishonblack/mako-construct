import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GitCompare, ChevronDown } from "lucide-react";
import type { LockSnapshot, BinderState } from "@/hooks/use-binder-state";

interface DiffViewProps {
  currentState: BinderState;
  lockHistory: LockSnapshot[];
}

interface DiffEntry {
  field: string;
  section: string;
  before: string;
  after: string;
  type: "added" | "removed" | "modified";
}

function compareStates(before: Partial<BinderState>, after: Partial<BinderState>): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  // Production Definition fields
  const prodFields: { key: keyof BinderState; label: string }[] = [
    { key: "partner", label: "Partner" },
    { key: "venue", label: "Venue" },
    { key: "showType", label: "Show Type" },
    { key: "eventDate", label: "Game Date" },
    { key: "eventTime", label: "Game Time" },
    { key: "homeTeam", label: "Home Team" },
    { key: "awayTeam", label: "Away Team" },
    { key: "siteType", label: "Site Type" },
    { key: "commercials", label: "Commercials" },
  ];

  for (const f of prodFields) {
    const b = String(before[f.key] ?? "");
    const a = String(after[f.key] ?? "");
    if (b !== a) {
      diffs.push({ field: f.label, section: "Production", before: b || "(empty)", after: a || "(empty)", type: b ? "modified" : "added" });
    }
  }

  // ISO count
  if ((before.isoCount ?? 0) !== (after.isoCount ?? 0)) {
    diffs.push({ field: "ISO Count", section: "Signals", before: String(before.isoCount ?? 0), after: String(after.isoCount ?? 0), type: "modified" });
  }

  // Return feed
  if ((before.returnRequired ?? false) !== (after.returnRequired ?? false)) {
    diffs.push({ field: "Return Feed", section: "Transport", before: before.returnRequired ? "Required" : "Not Required", after: after.returnRequired ? "Required" : "Not Required", type: "modified" });
  }

  // Signal aliases changed
  const beforeSignals = before.signals || [];
  const afterSignals = after.signals || [];
  const maxLen = Math.max(beforeSignals.length, afterSignals.length);
  let aliasChanges = 0;
  let patchChanges = 0;
  for (let i = 0; i < maxLen; i++) {
    const bs = beforeSignals[i];
    const as = afterSignals[i];
    if (!bs && as) { aliasChanges++; continue; }
    if (bs && !as) { aliasChanges++; continue; }
    if (bs && as) {
      if (bs.productionAlias !== as.productionAlias) aliasChanges++;
      if (bs.onsitePatch !== as.onsitePatch || bs.hqPatch !== as.hqPatch) patchChanges++;
    }
  }
  if (aliasChanges > 0) {
    diffs.push({ field: `Signal Aliases (${aliasChanges} changed)`, section: "Signals", before: `${beforeSignals.length} signals`, after: `${afterSignals.length} signals`, type: "modified" });
  }
  if (patchChanges > 0) {
    diffs.push({ field: `Patchpoint Mappings (${patchChanges} changed)`, section: "Signals", before: "—", after: "—", type: "modified" });
  }

  // Transport protocol
  if (before.transport?.primary?.protocol !== after.transport?.primary?.protocol) {
    diffs.push({ field: "Primary Transport", section: "Transport", before: before.transport?.primary?.protocol || "(none)", after: after.transport?.primary?.protocol || "(none)", type: "modified" });
  }
  if (before.transport?.backup?.protocol !== after.transport?.backup?.protocol) {
    diffs.push({ field: "Backup Transport", section: "Transport", before: before.transport?.backup?.protocol || "(none)", after: after.transport?.backup?.protocol || "(none)", type: "modified" });
  }

  // Checklist
  const beforeChecked = (before.checklist || []).filter(c => c.checked).length;
  const afterChecked = (after.checklist || []).filter(c => c.checked).length;
  if (beforeChecked !== afterChecked) {
    diffs.push({ field: "Checklist Progress", section: "Checklist", before: `${beforeChecked}/${(before.checklist || []).length}`, after: `${afterChecked}/${(after.checklist || []).length}`, type: "modified" });
  }

  // Docs count
  if ((before.docs || []).length !== (after.docs || []).length) {
    diffs.push({ field: "Assets", section: "Assets", before: `${(before.docs || []).length} docs`, after: `${(after.docs || []).length} docs`, type: (after.docs || []).length > (before.docs || []).length ? "added" : "removed" });
  }

  return diffs;
}

const typeColor = {
  added: "text-emerald-400 bg-emerald-900/20 border-emerald-500/20",
  removed: "text-crimson bg-crimson/10 border-crimson/20",
  modified: "text-amber-400 bg-amber-900/20 border-amber-500/20",
};

const typeLabel = { added: "Added", removed: "Removed", modified: "Modified" };

export function DiffView({ currentState, lockHistory }: DiffViewProps) {
  const [compareToIdx, setCompareToIdx] = useState(0);
  const [showSelector, setShowSelector] = useState(false);

  const compareTo = lockHistory[compareToIdx] || null;

  const diffs = useMemo(() => {
    if (!compareTo) return [];
    return compareStates(compareTo.state, currentState);
  }, [compareTo, currentState]);

  const sections = useMemo(() => {
    const map = new Map<string, DiffEntry[]>();
    for (const d of diffs) {
      if (!map.has(d.section)) map.set(d.section, []);
      map.get(d.section)!.push(d);
    }
    return Array.from(map.entries());
  }, [diffs]);

  if (lockHistory.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.55 }}
      >
        <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Diff</h2>
        <div className="steel-panel p-5 text-center">
          <GitCompare className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No lock snapshots yet. Lock the production to create a comparison baseline.</p>
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.55 }}
    >
      <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Diff</h2>
      <div className="steel-panel p-5 space-y-4">
        {/* Comparison selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Comparing current state vs</span>
            <div className="relative">
              <button
                onClick={() => setShowSelector(!showSelector)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono bg-secondary border border-border rounded-sm hover:border-crimson transition-colors"
              >
                {compareTo ? compareTo.id : "Select…"}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showSelector && (
                <div className="absolute top-full left-0 mt-1 z-10 bg-card border border-border rounded-sm shadow-lg overflow-hidden min-w-48">
                  {lockHistory.map((snap, i) => (
                    <button
                      key={snap.id}
                      onClick={() => { setCompareToIdx(i); setShowSelector(false); }}
                      className={`w-full text-left px-3 py-2 text-[11px] hover:bg-secondary/70 transition-colors border-b border-border last:border-0 ${i === compareToIdx ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
                    >
                      <span className="font-mono">{snap.id}</span>
                      <span className="ml-2">{new Date(snap.lockedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {diffs.length} change{diffs.length !== 1 ? "s" : ""} detected
          </span>
        </div>

        {/* Diff results */}
        {diffs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No changes since {compareTo?.id}</p>
        ) : (
          <div className="space-y-4">
            {sections.map(([section, entries]) => (
              <div key={section}>
                <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground block mb-2">{section}</span>
                <div className="space-y-1">
                  {entries.map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded bg-secondary/30 text-sm">
                      <span className={`text-[9px] tracking-wider uppercase px-1.5 py-0.5 rounded border ${typeColor[d.type]}`}>
                        {typeLabel[d.type]}
                      </span>
                      <span className="text-foreground font-medium min-w-32">{d.field}</span>
                      {d.type === "modified" && (
                        <>
                          <span className="text-muted-foreground line-through text-xs">{d.before}</span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className="text-foreground text-xs">{d.after}</span>
                        </>
                      )}
                      {d.type === "added" && <span className="text-emerald-400 text-xs">{d.after}</span>}
                      {d.type === "removed" && <span className="text-crimson text-xs line-through">{d.before}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
