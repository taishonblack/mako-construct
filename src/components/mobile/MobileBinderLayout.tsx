import { useState, useMemo } from "react";
import { isToday, isPast, parseISO } from "date-fns";
import { ClipboardCheck, Radio, FileText, StickyNote, Settings2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { BinderState, ChecklistItem } from "@/hooks/use-binder-state";
import type { ReadinessReport } from "@/lib/readiness-engine";
import type { SignalRoute } from "@/stores/route-store";

import { MobileBinderHeader } from "./MobileBinderHeader";
import { MobileSignalCards } from "./MobileSignalCards";
import { MobileBinderActionBar } from "./MobileBinderActionBar";
import { CommandBrief } from "@/components/command/CommandBrief";
import { ChecklistTable } from "@/components/checklist/ChecklistTable";
import { TransportProfile } from "@/components/command/TransportProfile";
import { AudioPhilosophy } from "@/components/command/AudioPhilosophy";
import { ExecutionTimeline } from "@/components/command/ExecutionTimeline";
import { IssuesChanges } from "@/components/command/IssuesChanges";
import { DocumentArchive } from "@/components/command/DocumentArchive";
import { DiffView } from "@/components/command/DiffView";
import type { DocEntry } from "@/data/mock-phase5";

type BinderTab = "today" | "signals" | "assets" | "notes" | "advanced";

const TABS: { id: BinderTab; label: string; icon: React.ReactNode }[] = [
  { id: "today", label: "Today", icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
  { id: "signals", label: "Signals", icon: <Radio className="w-3.5 h-3.5" /> },
  { id: "assets", label: "Assets", icon: <FileText className="w-3.5 h-3.5" /> },
  { id: "notes", label: "Notes", icon: <StickyNote className="w-3.5 h-3.5" /> },
  { id: "advanced", label: "Advanced", icon: <Settings2 className="w-3.5 h-3.5" /> },
];

/* ── Checklist Summary Counts ── */
function ChecklistSummary({ items }: { items: ChecklistItem[] }) {
  const counts = useMemo(() => {
    let open = 0, dueToday = 0, overdue = 0, unassigned = 0;
    const now = new Date();
    for (const item of items) {
      if (item.status === "done" || item.checked) continue;
      open++;
      if (!item.assignedTo) unassigned++;
      if (item.dueAt) {
        try {
          const due = parseISO(item.dueAt);
          if (isToday(due)) dueToday++;
          else if (isPast(due)) overdue++;
        } catch { /* skip */ }
      }
    }
    return { open, dueToday, overdue, unassigned };
  }, [items]);

  const chips: { label: string; value: number; color: string }[] = [
    { label: "Open", value: counts.open, color: "text-foreground" },
    { label: "Due today", value: counts.dueToday, color: "text-amber-400" },
    { label: "Overdue", value: counts.overdue, color: "text-primary" },
    { label: "Unassigned", value: counts.unassigned, color: "text-muted-foreground" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {chips.map((c) => (
        <div key={c.label} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary border border-border">
          <span className={`text-xs font-mono font-medium ${c.color}`}>{c.value}</span>
          <span className="text-[9px] tracking-wider uppercase text-muted-foreground">{c.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Collapsible Section within tabs ── */
function CollapsibleSection({ title, defaultOpen = true, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="steel-panel overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-secondary/30 transition-colors">
        <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">{title}</h3>
        <span className="text-muted-foreground text-xs">{open ? "−" : "+"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3.5 pb-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MobileBinderLayoutProps {
  binder: { title: string; status: string };
  state: BinderState;
  report: ReadinessReport;
  routes: SignalRoute[];
  previewMode: boolean;
  isLocked: boolean;
  isReadOnly: boolean;
  draftChecklist: ChecklistItem[];
  checklistDirty: boolean;
  displayName: string;
  onToggleMode: () => void;
  onEdit: () => void;
  onSetDraftChecklist: (items: ChecklistItem[]) => void;
  onSaveChecklist: () => void;
  onDiscardChecklist: () => void;
  onPromptDisplayName: () => void;
  onUpdateAudioPhilosophy: (data: any) => void;
  onAddDoc: (doc: DocEntry) => void;
  onRemoveDoc: (id: string) => void;
  onUpdateDoc: (id: string, field: keyof DocEntry, value: string) => void;
}

export function MobileBinderLayout({
  binder, state, report, routes,
  previewMode, isLocked, isReadOnly,
  draftChecklist, checklistDirty, displayName,
  onToggleMode, onEdit,
  onSetDraftChecklist, onSaveChecklist, onDiscardChecklist,
  onPromptDisplayName,
  onUpdateAudioPhilosophy,
  onAddDoc, onRemoveDoc, onUpdateDoc,
}: MobileBinderLayoutProps) {
  const [activeTab, setActiveTab] = useState<BinderTab>("today");

  const metadata = useMemo(() => {
    const chips: { label: string; value: string }[] = [];
    if (state.eventTime) chips.push({ label: "Time", value: state.eventTime });
    if (state.venue) chips.push({ label: "Arena", value: state.venue.split(",")[0] });
    if (state.eventHeader?.controlRoom) chips.push({ label: "CR", value: `CR-${state.eventHeader.controlRoom}` });
    if (state.partner) chips.push({ label: "Partner", value: state.partner });
    if (state.isoCount) chips.push({ label: "ISOs", value: String(state.isoCount) });
    if (state.returnRequired) chips.push({ label: "Return", value: "On" });
    return chips;
  }, [state]);

  const eventStatus = isLocked ? "validated" : binder.status === "active" ? "configured" : "planning";
  const checklistDone = draftChecklist.filter(c => c.status === "done" || c.checked).length;

  return (
    <div className="max-w-screen-sm mx-auto w-full px-4 overflow-x-hidden box-border pb-28">
      {/* Mobile Header Card */}
      <MobileBinderHeader
        title={binder.title}
        status={eventStatus}
        readiness={report.level}
        metadata={metadata}
        locked={isLocked}
        lockVersion={state.currentLock?.version}
        onEdit={onEdit}
        previewMode={previewMode}
      />

      {/* In-Binder Tab Navigation */}
      <div className="sticky top-0 z-30 -mx-4 px-4 pt-2 pb-1 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] tracking-[0.15em] uppercase font-medium rounded-t-sm transition-colors ${
                activeTab === tab.id
                  ? "text-primary border-b-2 border-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-3 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "today" && (
              <div className="space-y-3">
                {/* Checklist */}
                <div className="steel-panel p-3.5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">
                      Checklist
                    </h3>
                    <span className="text-[10px] font-mono text-primary">
                      {checklistDone}/{draftChecklist.length}
                    </span>
                  </div>
                  <ChecklistSummary items={draftChecklist} />
                  <div className="max-w-full overflow-x-hidden">
                    <ChecklistTable
                      items={draftChecklist}
                      onChange={onSetDraftChecklist}
                      readOnly={isReadOnly}
                      displayName={displayName}
                      onPromptDisplayName={onPromptDisplayName}
                      showAddTask={!isReadOnly}
                    />
                  </div>
                </div>

                {/* Transport Snapshot */}
                <div className="steel-panel p-3.5">
                  <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium mb-3">
                    Transport
                  </h3>
                  <TransportProfile config={state.transport} returnRequired={state.returnRequired} />
                </div>

                {/* Summary */}
                <CollapsibleSection title="Summary" defaultOpen={false}>
                  <CommandBrief
                    venue={state.venue}
                    partner={state.partner}
                    isoCount={state.isoCount}
                    report={report}
                    issues={state.issues}
                    changes={state.changes}
                    checklist={state.checklist}
                  />
                </CollapsibleSection>
              </div>
            )}

            {activeTab === "signals" && (
              <div className="space-y-3">
                <MobileSignalCards signals={state.signals} routes={routes} />
              </div>
            )}

            {activeTab === "assets" && (
              <div className="space-y-3">
                <DocumentArchive
                  docs={state.docs}
                  onAddDoc={isReadOnly ? () => {} : onAddDoc}
                  onRemoveDoc={isReadOnly ? () => {} : onRemoveDoc}
                  onUpdateDoc={isReadOnly ? () => {} : onUpdateDoc}
                />
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-3">
                {/* Audio Philosophy as Notes */}
                <div className="steel-panel p-3.5">
                  <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium mb-3">Audio Notes</h3>
                  <AudioPhilosophy
                    data={state.audioPhilosophy}
                    onChange={isReadOnly ? () => {} : onUpdateAudioPhilosophy}
                    readOnly={isReadOnly}
                  />
                </div>

                {/* Timeline */}
                <CollapsibleSection title="Timeline" defaultOpen={false}>
                  <ExecutionTimeline />
                </CollapsibleSection>

                {/* Issues & Changes */}
                <CollapsibleSection title="Issues & Changes" defaultOpen={false}>
                  <IssuesChanges changes={state.changes} issues={state.issues} />
                </CollapsibleSection>
              </div>
            )}

            {activeTab === "advanced" && (
              <div className="space-y-3">
                <CollapsibleSection title="Diff / Lock History" defaultOpen={false}>
                  <DiffView
                    currentState={state}
                    lockHistory={state.lockHistory || []}
                  />
                </CollapsibleSection>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky Action Bar */}
      <MobileBinderActionBar
        previewMode={previewMode}
        isLocked={isLocked}
        checklistDirty={checklistDirty && !isReadOnly}
        onToggleMode={onToggleMode}
        onSaveChecklist={onSaveChecklist}
        onDiscardChecklist={onDiscardChecklist}
      />
    </div>
  );
}
