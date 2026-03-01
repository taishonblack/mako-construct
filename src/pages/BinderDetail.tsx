import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Pencil, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useBinder } from "@/hooks/use-binders";
import { binderStore } from "@/stores/binder-store";
import { computeReadiness } from "@/lib/readiness-engine";
import { useBinderState } from "@/hooks/use-binder-state";
import { useRoutesStore } from "@/stores/route-store";
import { BinderRoutesSection } from "@/components/routes/BinderRoutesSection";

import { BinderHeader, type BinderHeaderData } from "@/components/binder/BinderHeader";
import { IsoRoutingTable } from "@/components/binder/IsoRoutingTable";
import { LqUnitSection } from "@/components/binder/LqUnitSection";
import { BitfireSection } from "@/components/binder/BitfireSection";
import { HardwarePoolSection } from "@/components/binder/HardwarePoolSection";
import { DocumentArchive } from "@/components/command/DocumentArchive";
import { ChecklistTable } from "@/components/checklist/ChecklistTable";
import { SaveBar } from "@/components/checklist/SaveBar";
import { useDisplayName } from "@/hooks/use-display-name";
import { AudioPhilosophy } from "@/components/command/AudioPhilosophy";
import { BinderCopilot } from "@/components/command/BinderCopilot";
import type { ReadinessLevel } from "@/lib/readiness-engine";

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-secondary text-foreground",
  completed: "bg-emerald-900/30 text-emerald-400",
  archived: "bg-muted text-muted-foreground",
};

const readinessConfig: Record<ReadinessLevel, { label: string; dot: string; text: string }> = {
  ready: { label: "Ready", dot: "bg-emerald-400", text: "text-emerald-400" },
  risk: { label: "Risk", dot: "bg-amber-400", text: "text-amber-400" },
  blocked: { label: "Blocked", dot: "bg-primary", text: "text-primary" },
};

export default function BinderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const binderId = id || "1";

  const { binder: storeRecord, loading: binderLoading } = useBinder(binderId);

  const binder = storeRecord
    ? {
        id: storeRecord.id,
        title: storeRecord.title,
        partner: storeRecord.partner,
        venue: storeRecord.venue,
        eventDate: storeRecord.eventDate,
        status: storeRecord.status,
        isoCount: storeRecord.isoCount,
        openIssues: storeRecord.openIssues || 0,
        transport: storeRecord.primaryTransport || storeRecord.transport,
        backupTransport: storeRecord.backupTransport || "MPEG-TS",
        returnFeed: storeRecord.returnRequired,
        encodersRequired: Math.ceil((storeRecord.isoCount || 12) / 2),
        encodersAssigned: Math.ceil((storeRecord.isoCount || 12) / 2),
      }
    : {
        id: binderId,
        title: "Untitled Binder",
        partner: "",
        venue: "",
        eventDate: new Date().toISOString().slice(0, 10),
        status: "draft" as const,
        isoCount: 12,
        openIssues: 0,
        transport: "SRT",
        backupTransport: "MPEG-TS",
        returnFeed: false,
        encodersRequired: 6,
        encodersAssigned: 6,
      };

  const {
    state, update, setIsoCount, updateSignal, updateSignals, updateTopology,
    toggleChecklist, addDoc, removeDoc, updateDoc,
    updateComm, addComm, removeComm,
    lockBinder, unlockBinder,
    updateEventHeader, generateTxRx,
    updateAudioPhilosophy,
    syncSignalsFromRoutes,
    addChecklistItem, updateChecklistItem, removeChecklistItem,
  } = useBinderState(binderId);

  const { state: routesState } = useRoutesStore();

  useEffect(() => {
    if (routesState.routes.length > 0) {
      syncSignalsFromRoutes(routesState.routes);
    }
  }, [routesState.routes, syncSignalsFromRoutes]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const timeout = setTimeout(() => {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, []);

  const [previewMode, setPreviewMode] = useState(true);
  const { displayName, setDisplayName } = useDisplayName();
  const [namePrompt, setNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const [draftChecklist, setDraftChecklist] = useState<import("@/hooks/use-binder-state").ChecklistItem[]>(() => [...state.checklist]);
  const checklistDirty = useMemo(() => JSON.stringify(draftChecklist) !== JSON.stringify(state.checklist), [draftChecklist, state.checklist]);

  useEffect(() => {
    if (!checklistDirty) {
      setDraftChecklist([...state.checklist]);
    }
  }, [state.checklist]);

  useEffect(() => {
    if (!checklistDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [checklistDirty]);

  const saveChecklist = useCallback(() => {
    update("checklist", draftChecklist);
  }, [draftChecklist, update]);

  const discardChecklist = useCallback(() => {
    setDraftChecklist([...state.checklist]);
  }, [state.checklist]);

  const isLocked = state.currentLock?.locked ?? false;
  const isReadOnly = previewMode || isLocked;

  const report = useMemo(
    () => computeReadiness(
      state.signals,
      binder.encodersAssigned ?? 10,
      state.transport,
      state.issues,
      state.returnRequired,
      state.checklist,
      state.comms,
      state.eventHeader,
      state.audioPhilosophy,
      routesState.routes,
    ),
    [state.signals, binder.encodersAssigned, state.transport, state.issues, state.returnRequired, state.checklist, state.comms, state.eventHeader, state.audioPhilosophy, routesState.routes]
  );

  const r = readinessConfig[report.level];

  // Build BinderHeaderData from store + state
  const headerData: BinderHeaderData = useMemo(() => ({
    title: binder.title,
    status: binder.status as any,
    eventDate: state.eventDate || binder.eventDate,
    eventTime: state.eventTime || storeRecord?.eventTime || "19:00",
    timezone: state.timezone || storeRecord?.timezone || "America/New_York",
    awayTeam: state.awayTeam || storeRecord?.awayTeam || "",
    homeTeam: state.homeTeam || storeRecord?.homeTeam || "",
    venue: state.venue || binder.venue,
    broadcastFeed: storeRecord?.broadcastFeed || state.eventHeader?.broadcastFeed || "",
    rehearsalDate: storeRecord?.rehearsalDate || state.eventHeader?.rehearsalDate || "",
    partner: state.partner || binder.partner,
    partners: (storeRecord as any)?.partners || [],
    techManagers: (storeRecord as any)?.techManagers || [],
  }), [binder, state, storeRecord]);

  const handleHeaderChange = useCallback((data: BinderHeaderData) => {
    // Persist to store
    binderStore.update(binderId, {
      title: data.title,
      venue: data.venue,
      partner: data.partner,
      status: data.status,
      eventTime: data.eventTime,
      timezone: data.timezone,
      homeTeam: data.homeTeam,
      awayTeam: data.awayTeam,
      rehearsalDate: data.rehearsalDate,
      broadcastFeed: data.broadcastFeed,
      partners: data.partners as any,
      techManagers: data.techManagers as any,
    } as any);
    if (data.eventDate !== state.eventDate) {
      binderStore.update(binderId, { eventDate: data.eventDate } as any);
    }
    // Update local state
    update("partner", data.partner);
    update("venue", data.venue);
    update("eventDate", data.eventDate);
    update("eventTime", data.eventTime);
    update("timezone", data.timezone);
    update("homeTeam", data.homeTeam);
    update("awayTeam", data.awayTeam);
  }, [binderId, state, update]);

  const lockedSetIsoCount = useCallback((count: number) => { if (!isReadOnly) setIsoCount(count); }, [isReadOnly, setIsoCount]);
  const lockedUpdateSignal = useCallback((iso: number, field: keyof import("@/lib/signal-utils").Signal, value: string) => {
    if (!isReadOnly) updateSignal(iso, field, value);
  }, [isReadOnly, updateSignal]);
  const lockedUpdateSignals = useCallback((updater: (signals: import("@/lib/signal-utils").Signal[]) => import("@/lib/signal-utils").Signal[]) => {
    if (!isReadOnly) updateSignals(updater);
  }, [isReadOnly, updateSignals]);

  if (binderLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      <BinderCopilot state={state} report={report} />

      {/* ═══ STICKY TOP BAR ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary">
              MAKO LIVE
            </span>
            <div className="w-px h-4 bg-border" />
            <h1 className="text-sm font-medium text-foreground tracking-tight">{binder.title || "Untitled"}</h1>
            <span className={`text-[9px] font-medium tracking-[0.15em] uppercase px-2 py-0.5 rounded ${statusStyles[binder.status] || statusStyles.draft}`}>
              {binder.status}
            </span>
            {isLocked && (
              <span className="flex items-center gap-1 text-[9px] font-medium tracking-[0.15em] uppercase px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400">
                <Lock className="w-2.5 h-2.5" />
                Locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {previewMode && !isLocked && (
              <Button variant="outline" size="sm" onClick={() => setPreviewMode(false)}
                className="text-[10px] tracking-wider uppercase gap-1.5">
                <Pencil className="w-3 h-3" /> Edit Binder
              </Button>
            )}
            {!previewMode && !isLocked && (
              <Button variant="ghost" size="sm" onClick={() => setPreviewMode(true)}
                className="text-[10px] tracking-wider uppercase gap-1.5 text-muted-foreground">
                <Eye className="w-3 h-3" /> Exit Edit Mode
              </Button>
            )}
            {previewMode && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium tracking-[0.15em] uppercase rounded bg-secondary text-muted-foreground border border-border">
                <Eye className="w-2.5 h-2.5" /> Preview
              </span>
            )}
            {!previewMode && !isLocked && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-medium tracking-[0.15em] uppercase rounded bg-primary/10 text-primary border border-primary/30">
                <Pencil className="w-2.5 h-2.5" /> Editing
              </span>
            )}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${r.dot} ${report.level === "blocked" ? "animate-pulse" : ""}`} />
              <span className={`text-xs font-medium tracking-wider uppercase ${r.text}`}>{r.label}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ BREADCRUMB ═══ */}
      <div className="px-6 pt-4">
        <Link to="/binders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Binders
        </Link>
      </div>

      {/* ═══ MAIN CONTENT — FULL WIDTH ═══ */}
      <div className="px-6 py-6 space-y-8">

        {/* BINDER HEADER (inline, full-width) */}
        <BinderHeader
          data={headerData}
          onChange={isReadOnly ? () => {} : handleHeaderChange}
          readOnly={isReadOnly}
        />

        {/* AUDIO PHILOSOPHY */}
        <AudioPhilosophy data={state.audioPhilosophy} onChange={isReadOnly ? () => {} : updateAudioPhilosophy} readOnly={isReadOnly} />

        {/* ISO ROUTING TABLE */}
        <IsoRoutingTable
          rows={state.isoRoutingRows || []}
          onRowsChange={(rows) => !isReadOnly && update("isoRoutingRows", rows)}
          partner={state.partner || binder.partner}
          readOnly={isReadOnly}
        />

        {/* ONSITE CONFIGURATION */}
        <div className="space-y-6">
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground border-b border-border pb-2">
            Onsite Configuration
          </h2>

          <LqUnitSection
            config={state.lqConfig}
            onChange={(c) => !isReadOnly && update("lqConfig", c)}
            readOnly={isReadOnly}
          />

          <BitfireSection
            config={state.bitfireConfig}
            onChange={(c) => !isReadOnly && update("bitfireConfig", c)}
            readOnly={isReadOnly}
          />

          <HardwarePoolSection
            config={state.hardwarePool}
            onChange={(c) => !isReadOnly && update("hardwarePool", c)}
            readOnly={isReadOnly}
            isoRoutedToDecoders={(state.isoRoutingRows || []).filter(r => r.destinationType === "ISO Record" || r.destinationType === "Program").length}
          />
        </div>

        {/* BINDER ROUTES */}
        <motion.section
          id="binder-routes"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <BinderRoutesSection
            binderId={binderId}
            routeMode={(storeRecord as any)?.route_mode || "use_default"}
            routeProfileId={(storeRecord as any)?.route_profile_id || null}
            onModeChange={(mode, profileId) => {
              binderStore.update(binderId, { route_mode: mode, route_profile_id: profileId } as any);
            }}
            readOnly={isReadOnly}
          />
        </motion.section>

        {/* DOCUMENTS */}
        <DocumentArchive docs={state.docs} onAddDoc={isReadOnly ? () => {} : addDoc} onRemoveDoc={isReadOnly ? () => {} : removeDoc} onUpdateDoc={isReadOnly ? () => {} : updateDoc} />

        {/* NOTES */}
        <motion.section
          id="notes"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Notes</h2>
          <div className="steel-panel p-5">
            {isReadOnly ? (
              <p className="text-sm text-foreground whitespace-pre-wrap min-h-[60px]">
                {state.notes || <span className="text-muted-foreground italic">No notes yet.</span>}
              </p>
            ) : (
              <textarea
                value={state.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Add notes about this production…"
                rows={4}
                className="w-full text-sm bg-secondary border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
            )}
          </div>
        </motion.section>

        {/* CHECKLIST */}
        <motion.section
          id="checklist"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Checklist</h2>
            <span className={`text-[10px] font-mono ${draftChecklist.filter(c => c.status === "done" || c.checked).length === draftChecklist.length ? "text-emerald-500" : "text-muted-foreground"}`}>
              {draftChecklist.filter(c => c.status === "done" || c.checked).length}/{draftChecklist.length}
            </span>
            <div className="flex-1 max-w-32 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${draftChecklist.length > 0 ? (draftChecklist.filter(c => c.status === "done" || c.checked).length / draftChecklist.length) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="steel-panel p-5">
            {namePrompt && (
              <div className="mb-3 p-3 bg-secondary/50 rounded-sm border border-border flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Set your name:</span>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your name…"
                  className="h-8 text-sm max-w-48 bg-secondary border border-border rounded px-2 text-foreground focus:outline-none focus:border-primary"
                  onKeyDown={(e) => { if (e.key === "Enter" && nameInput.trim()) { setDisplayName(nameInput.trim()); setNamePrompt(false); } }}
                  autoFocus
                />
                <button onClick={() => { if (nameInput.trim()) { setDisplayName(nameInput.trim()); } setNamePrompt(false); }}
                  className="px-3 py-1.5 text-[10px] tracking-wider uppercase bg-primary text-primary-foreground rounded-sm">Save</button>
              </div>
            )}
            <ChecklistTable
              items={draftChecklist}
              onChange={setDraftChecklist}
              readOnly={isReadOnly}
              displayName={displayName}
              onPromptDisplayName={() => { setNamePrompt(true); setNameInput(displayName); }}
              showAddTask={!isReadOnly}
            />
          </div>
        </motion.section>

        <SaveBar isDirty={checklistDirty && !isReadOnly} onSave={saveChecklist} onDiscard={discardChecklist} />
      </div>
    </div>
  );
}
