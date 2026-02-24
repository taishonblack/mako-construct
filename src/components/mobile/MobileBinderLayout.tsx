import { useState, useMemo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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

interface AccordionSectionProps {
  title: string;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

function AccordionSection({ title, defaultOpen = false, badge, children }: AccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="steel-panel overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-medium">{title}</h3>
          {badge && (
            <span className="text-[9px] font-mono text-primary">{badge}</span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
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
            <div className="px-3.5 pb-3.5">
              {children}
            </div>
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
  const metadata = useMemo(() => {
    const chips: { label: string; value: string }[] = [];
    if (state.eventTime) chips.push({ label: "Time", value: state.eventTime });
    if (state.venue) chips.push({ label: "Arena", value: state.venue.split(",")[0] });
    if (state.eventHeader?.controlRoom) chips.push({ label: "CR", value: `CR-${state.eventHeader.controlRoom}` });
    if (state.partner) chips.push({ label: "Partner", value: state.partner });
    if (state.isoCount) chips.push({ label: "ISOs", value: String(state.isoCount) });
    return chips;
  }, [state]);

  const eventStatus = isLocked ? "validated" : binder.status === "active" ? "configured" : "planning";
  const checklistDone = draftChecklist.filter(c => c.status === "done" || c.checked).length;

  return (
    <div className="space-y-3 pb-24">
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

      {/* Accordion Sections */}
      <AccordionSection title="Summary" defaultOpen>
        <CommandBrief
          venue={state.venue}
          partner={state.partner}
          isoCount={state.isoCount}
          report={report}
          issues={state.issues}
          changes={state.changes}
          checklist={state.checklist}
        />
      </AccordionSection>

      <AccordionSection
        title="Checklist"
        defaultOpen
        badge={`${checklistDone}/${draftChecklist.length}`}
      >
        <div className="overflow-x-auto -mx-1">
          <ChecklistTable
            items={draftChecklist}
            onChange={onSetDraftChecklist}
            readOnly={isReadOnly}
            displayName={displayName}
            onPromptDisplayName={onPromptDisplayName}
            showAddTask={!isReadOnly}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="Transport" defaultOpen>
        <TransportProfile config={state.transport} returnRequired={state.returnRequired} />
      </AccordionSection>

      <AccordionSection title="Signals" badge={`${state.signals.length} ISOs`}>
        <MobileSignalCards signals={state.signals} routes={routes} />
      </AccordionSection>

      <AccordionSection title="Audio">
        <AudioPhilosophy
          data={state.audioPhilosophy}
          onChange={isReadOnly ? () => {} : onUpdateAudioPhilosophy}
          readOnly={isReadOnly}
        />
      </AccordionSection>

      <AccordionSection title="Timeline">
        <ExecutionTimeline />
      </AccordionSection>

      <AccordionSection title="Issues & Changes">
        <IssuesChanges changes={state.changes} issues={state.issues} />
      </AccordionSection>

      <AccordionSection title="Documents">
        <DocumentArchive
          docs={state.docs}
          onAddDoc={isReadOnly ? () => {} : onAddDoc}
          onRemoveDoc={isReadOnly ? () => {} : onRemoveDoc}
          onUpdateDoc={isReadOnly ? () => {} : onUpdateDoc}
        />
      </AccordionSection>

      <AccordionSection title="Advanced (Diff / Lock)">
        <DiffView
          currentState={state}
          lockHistory={state.lockHistory || []}
        />
      </AccordionSection>

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
