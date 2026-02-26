import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Wand2, Eye, Pencil, GitCompare, FileDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useBinder } from "@/hooks/use-binders";
import { binderStore } from "@/stores/binder-store";
import { mockBinderDetail } from "@/data/mock-binder-detail";
import { computeReadiness } from "@/lib/readiness-engine";
import { useBinderState } from "@/hooks/use-binder-state";
import { useRoutesStore } from "@/stores/route-store";

import { CommandHeader } from "@/components/command/CommandHeader";
import { EventCommandHeader } from "@/components/command/EventCommandHeader";
import { CommandBrief } from "@/components/command/CommandBrief";
import { ProductionDefinition } from "@/components/command/ProductionDefinition";
import { SignalMatrix } from "@/components/command/SignalMatrix";
import { TransportProfile } from "@/components/command/TransportProfile";
import { ExecutionTimeline } from "@/components/command/ExecutionTimeline";
import { IssuesChanges } from "@/components/command/IssuesChanges";
import { DocumentArchive } from "@/components/command/DocumentArchive";
import { ChecklistTable } from "@/components/checklist/ChecklistTable";
import { SaveBar } from "@/components/checklist/SaveBar";
import { useDisplayName } from "@/hooks/use-display-name";
import { PreAirLock } from "@/components/command/PreAirLock";
import { DiffView } from "@/components/command/DiffView";
import { BinderFormModal, type BinderFormData } from "@/components/command/BinderFormModal";
import { BinderCopilot } from "@/components/command/BinderCopilot";
import { DocToBinderAssist, type DetectedField } from "@/components/command/DocToBinderAssist";
import { AudioPhilosophy } from "@/components/command/AudioPhilosophy";
import { PdfExport } from "@/components/command/PdfExport";
import { ActivityPanel } from "@/components/binder/ActivityPanel";

export default function BinderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const binderId = id || "1";

  const { binder: storeRecord, loading: binderLoading } = useBinder(binderId);

  const binder = storeRecord
    ? {
        ...mockBinderDetail,
        id: storeRecord.id,
        title: storeRecord.title,
        partner: storeRecord.partner,
        venue: storeRecord.venue,
        eventDate: storeRecord.eventDate,
        status: storeRecord.status,
        isoCount: storeRecord.isoCount,
        transport: storeRecord.primaryTransport || storeRecord.transport,
        backupTransport: storeRecord.backupTransport || "MPEG-TS",
        returnFeed: storeRecord.returnRequired,
      }
    : mockBinderDetail;

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

  const [editOpen, setEditOpen] = useState(false);
  const [docAssistOpen, setDocAssistOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string>("current");
  const diffRef = useRef<HTMLDivElement>(null);
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

  const eventStatus = isLocked ? "validated" as const : binder.status === "active" ? "configured" as const : "planning" as const;

  const handleEditSubmit = useCallback((data: BinderFormData) => {
    const changes: string[] = [];
    if (storeRecord) {
      if (data.partner !== storeRecord.partner) changes.push(`Partner updated: ${storeRecord.partner} → ${data.partner}`);
      if (data.isoCount !== storeRecord.isoCount) changes.push(`ISO Count updated: ${storeRecord.isoCount} → ${data.isoCount}`);
      if (data.venue !== storeRecord.venue) changes.push(`Arena updated: ${storeRecord.venue} → ${data.venue}`);
      if (data.status !== storeRecord.status) changes.push(`Status updated: ${storeRecord.status} → ${data.status}`);
      if (data.controlRoom !== storeRecord.controlRoom) changes.push(`Control Room updated: CR-${storeRecord.controlRoom} → CR-${data.controlRoom}`);
    }

    binderStore.update(binderId, {
      title: data.title, league: "NHL", venue: data.venue,
      showType: data.showType || "Standard",
      partner: data.partner, status: data.status, isoCount: data.isoCount,
      returnRequired: data.returnRequired, commercials: data.commercials || "local-insert",
      primaryTransport: data.primaryTransport,
      backupTransport: data.backupTransport,
      transport: data.primaryTransport,
      notes: data.notes, eventTime: data.eventTime, timezone: data.timezone,
      homeTeam: data.homeTeam, awayTeam: data.awayTeam,
      siteType: data.siteType || "Arena", studioLocation: data.studioLocation || "",
      customShowType: data.customShowType || "",
      customPrimaryTransport: data.customPrimaryTransport || "",
      customBackupTransport: data.customBackupTransport || "",
      customCommercials: data.customCommercials || "",
      signalNamingMode: data.signalNamingMode,
      canonicalSignals: data.canonicalSignals, customSignalNames: data.customSignalNames,
      encoderInputsPerUnit: data.encoderInputsPerUnit, encoderCount: data.encoderCount,
      decoderOutputsPerUnit: data.decoderOutputsPerUnit, decoderCount: data.decoderCount,
      autoAllocate: data.autoAllocate,
      controlRoom: data.controlRoom,
      rehearsalDate: data.rehearsalDate,
      broadcastFeed: data.broadcastFeed,
      onsiteTechManager: data.onsiteTechManager,
      returnFeedEndpoints: data.returnFeedEndpoints,
      encoders: data.encoders,
      decoders: data.decoders,
      outboundHost: data.outboundHost,
      outboundPort: data.outboundPort,
      inboundHost: data.inboundHost,
      inboundPort: data.inboundPort,
      lqRequired: data.lqRequired,
      lqPorts: data.lqPorts,
    });

    update("league", "NHL");
    update("partner", data.partner);
    update("venue", data.venue);
    update("showType", data.showType || "Standard");
    update("eventDate", data.eventDate);
    update("eventTime", data.eventTime);
    update("timezone", data.timezone);
    update("homeTeam", data.homeTeam);
    update("awayTeam", data.awayTeam);
    update("siteType", data.siteType || "Arena");
    update("returnRequired", data.returnRequired);
    update("commercials", data.commercials || "local-insert");

    if (data.isoCount !== state.isoCount) {
      setIsoCount(data.isoCount);
    }

    if (changes.length > 0) {
      const newChanges = changes.map((label, i) => ({
        id: `ch-${Date.now()}-${i}`, label, timestamp: new Date().toISOString(),
        status: "confirmed" as const, author: "System",
      }));
      update("changes", [...newChanges, ...state.changes]);
    }
  }, [binderId, storeRecord, state, update, setIsoCount]);

  const handleDelete = useCallback(() => {
    binderStore.delete(binderId);
    localStorage.removeItem(`mako-binder-${binderId}`);
    navigate("/binders");
  }, [binderId, navigate]);

  const handleTransportChange = useCallback((field: "primaryTransport" | "backupTransport", value: string) => {
    if (isReadOnly) return;
    binderStore.update(binderId, { [field]: value, ...(field === "primaryTransport" ? { transport: value } : {}) });
    if (field === "primaryTransport") {
      update("transport", { ...state.transport, primary: { ...state.transport.primary, protocol: value } });
    } else {
      update("transport", { ...state.transport, backup: { ...state.transport.backup, protocol: value } });
    }
  }, [binderId, state.transport, update, isReadOnly]);

  const lockedSetIsoCount = useCallback((count: number) => { if (!isReadOnly) setIsoCount(count); }, [isReadOnly, setIsoCount]);
  const lockedUpdateSignal = useCallback((iso: number, field: keyof import("@/data/mock-signals").Signal, value: string) => {
    if (!isReadOnly) updateSignal(iso, field, value);
  }, [isReadOnly, updateSignal]);
  const lockedUpdateSignals = useCallback((updater: (signals: import("@/data/mock-signals").Signal[]) => import("@/data/mock-signals").Signal[]) => {
    if (!isReadOnly) updateSignals(updater);
  }, [isReadOnly, updateSignals]);
  const lockedToggleChecklist = useCallback((id: string) => { if (!isReadOnly) toggleChecklist(id); }, [isReadOnly, toggleChecklist]);

  const handleDocAssistApply = useCallback((fields: DetectedField[]) => {
    const changes: string[] = [];
    for (const f of fields) {
      if (f.target === "isoCount") {
        const newCount = parseInt(f.value);
        if (!isNaN(newCount) && newCount !== state.isoCount) { setIsoCount(newCount); changes.push(`ISO Count → ${newCount}`); }
      } else if (f.target.startsWith("eventHeader.")) {
        const key = f.target.replace("eventHeader.", "") as keyof typeof state.eventHeader;
        if (state.eventHeader[key] !== undefined) { updateEventHeader({ ...state.eventHeader, [key]: f.value }); changes.push(`${f.label} → ${f.value}`); }
      } else if (f.target.startsWith("staff.")) {
        const role = f.target.replace("staff.", "");
        const newStaff = state.eventHeader.staff.map(s => s.role === role ? { ...s, name: f.value } : s);
        updateEventHeader({ ...state.eventHeader, staff: newStaff }); changes.push(`Staff ${role} → ${f.value}`);
      } else if (f.target.startsWith("signal.")) {
        const iso = parseInt(f.target.split(".")[1]);
        if (!isNaN(iso)) { updateSignal(iso, "productionAlias", f.value); changes.push(`ISO ${iso} alias → ${f.value}`); }
      } else if (f.target.startsWith("audioPhilosophy.")) {
        const key = f.target.replace("audioPhilosophy.", "") as keyof typeof state.audioPhilosophy;
        updateAudioPhilosophy({ ...state.audioPhilosophy, [key]: f.value }); changes.push(`${f.label} → ${f.value}`);
      }
    }
    if (changes.length > 0) {
      const newChanges = changes.map((label, i) => ({
        id: `ch-doc-${Date.now()}-${i}`, label: `Doc Assist: ${label}`,
        timestamp: new Date().toISOString(), status: "confirmed" as const, author: "Doc Assist",
      }));
      update("changes", [...newChanges, ...state.changes]);
    }
  }, [state, setIsoCount, updateEventHeader, updateSignal, updateAudioPhilosophy, update]);

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
      <CommandHeader
        eventName={binder.title}
        status={eventStatus}
        readiness={report.level}
        reasons={report.reasons}
        onEdit={isLocked ? undefined : () => setEditOpen(true)}
        locked={isLocked}
        lockVersion={state.currentLock?.version}
      />

      <div className="max-w-6xl mx-auto px-6 pt-4 flex items-center justify-between">
        <Link to="/binders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Binders
        </Link>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {(state.lockHistory?.length > 0) && (
          <div className="flex items-center gap-3">
            <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Version</span>
            <select
              className="text-xs bg-secondary border border-border rounded-sm px-2 py-1 text-foreground focus:outline-none focus:border-primary transition-colors"
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
            >
              <option value="current">Current (Working)</option>
              {state.lockHistory.map((snap) => (
                <option key={snap.id} value={snap.id}>
                  Lock v{snap.id.replace("lock-v", "")} — {new Date(snap.lockedAt).toLocaleString()}
                </option>
              ))}
            </select>
            {selectedVersion !== "current" && (
              <>
                <Button variant="outline" size="sm"
                  onClick={() => { diffRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  className="text-[10px] tracking-wider uppercase gap-1.5">
                  <GitCompare className="w-3 h-3" /> Compare
                </Button>
                {(() => {
                  const snap = state.lockHistory.find(s => s.id === selectedVersion);
                  return snap ? <PdfExport snapshot={snap} binderTitle={binder.title} /> : null;
                })()}
              </>
            )}
          </div>
        )}

        <EventCommandHeader
          data={state.eventHeader}
          onChange={isReadOnly ? () => {} : updateEventHeader}
          readOnly={isReadOnly}
          onGenerateTxRx={isReadOnly ? undefined : generateTxRx}
        />

        {!isReadOnly && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setDocAssistOpen(true)}
              className="text-[10px] tracking-wider uppercase">
              <Wand2 className="w-3 h-3 mr-1" /> Doc-to-Binder Assist
            </Button>
          </div>
        )}

        <AudioPhilosophy data={state.audioPhilosophy} onChange={isReadOnly ? () => {} : updateAudioPhilosophy} readOnly={isReadOnly} />

        <CommandBrief
          venue={state.venue} partner={state.partner} isoCount={state.isoCount}
          report={report} issues={state.issues} changes={state.changes} checklist={state.checklist}
        />

        <PreAirLock
          lockState={state.currentLock || { locked: false, lockedAt: null, lockedBy: "You", version: 0 }}
          lockHistory={state.lockHistory || []}
          report={report}
          onLock={lockBinder}
          onUnlock={unlockBinder}
        />

        <ProductionDefinition
          league={state.league} venue={state.venue} partner={state.partner}
          showType={state.showType} eventDate={state.eventDate} isoCount={state.isoCount}
          onIsoCountChange={lockedSetIsoCount}
          returnRequired={state.returnRequired}
          onReturnRequiredChange={(v) => !isReadOnly && update("returnRequired", v)}
          commercials={state.commercials}
          onCommercialsChange={(v) => !isReadOnly && update("commercials", v)}
          onFieldChange={(field, value) => !isReadOnly && update(field as keyof typeof state, value)}
          primaryTransport={storeRecord?.primaryTransport || binder.transport}
          backupTransport={storeRecord?.backupTransport || binder.backupTransport}
          onTransportChange={isReadOnly ? undefined : handleTransportChange}
        />

        <SignalMatrix
          signals={state.signals} report={report}
          onUpdateSignal={lockedUpdateSignal}
          onUpdateSignals={lockedUpdateSignals}
          topology={state.topology}
          routes={routesState.routes}
        />
        <TransportProfile config={state.transport} returnRequired={state.returnRequired} />
        <ExecutionTimeline />
        <IssuesChanges changes={state.changes} issues={state.issues} />
        <DocumentArchive docs={state.docs} onAddDoc={isReadOnly ? () => {} : addDoc} onRemoveDoc={isReadOnly ? () => {} : removeDoc} onUpdateDoc={isReadOnly ? () => {} : updateDoc} />
        
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

        <ActivityPanel binderId={binderId} />

        <SaveBar isDirty={checklistDirty && !isReadOnly} onSave={saveChecklist} onDiscard={discardChecklist} />

        <div ref={diffRef}>
          <DiffView
            currentState={state}
            lockHistory={state.lockHistory || []}
            preSelectedVersion={selectedVersion !== "current" ? selectedVersion : undefined}
          />
        </div>
      </div>

      <BinderFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        onDelete={handleDelete}
        mode="edit"
        oldIsoCount={state.isoCount}
        initial={{
          title: binder.title, league: "NHL",
          containerId: storeRecord?.containerId || "",
          gameType: storeRecord?.gameType || "Regular Season",
          season: storeRecord?.season || "2025–26",
          eventDate: state.eventDate, eventTime: state.eventTime || "19:00",
          timezone: state.timezone || "America/New_York",
          venue: state.venue,
          homeTeam: state.homeTeam || storeRecord?.homeTeam || "",
          awayTeam: state.awayTeam || storeRecord?.awayTeam || "",
          siteType: state.siteType || storeRecord?.siteType || "Arena",
          studioLocation: storeRecord?.studioLocation || "",
          showType: state.showType,
          customShowType: storeRecord?.customShowType || "",
          partner: state.partner, status: binder.status, isoCount: state.isoCount,
          returnRequired: state.returnRequired, commercials: state.commercials,
          customCommercials: storeRecord?.customCommercials || "",
          primaryTransport: storeRecord?.primaryTransport || binder.transport,
          customPrimaryTransport: storeRecord?.customPrimaryTransport || "",
          backupTransport: storeRecord?.backupTransport || binder.backupTransport,
          customBackupTransport: storeRecord?.customBackupTransport || "",
          notes: storeRecord?.notes || "",
          signalNamingMode: storeRecord?.signalNamingMode || "iso",
          canonicalSignals: storeRecord?.canonicalSignals || [],
          customSignalNames: storeRecord?.customSignalNames || "",
          encoderInputsPerUnit: state.topology?.encoderInputsPerUnit || storeRecord?.encoderInputsPerUnit || 2,
          encoderCount: state.topology?.encoderCount || storeRecord?.encoderCount || 6,
          decoderOutputsPerUnit: state.topology?.decoderOutputsPerUnit || storeRecord?.decoderOutputsPerUnit || 4,
          decoderCount: state.topology?.decoderCount || storeRecord?.decoderCount || 6,
          autoAllocate: storeRecord?.autoAllocate ?? true,
          srtPrimaryHost: "", srtPrimaryPort: "", srtPrimaryMode: "caller", srtPrimaryPassphrase: "",
          mpegPrimaryMulticast: "", mpegPrimaryPort: "",
          srtBackupHost: "", srtBackupPort: "", srtBackupMode: "caller", srtBackupPassphrase: "",
          mpegBackupMulticast: "", mpegBackupPort: "",
          saveAsTemplate: false, templateName: "",
          controlRoom: storeRecord?.controlRoom || "23",
          rehearsalDate: storeRecord?.rehearsalDate || "",
          broadcastFeed: storeRecord?.broadcastFeed || "",
          onsiteTechManager: storeRecord?.onsiteTechManager || "",
          returnFeedEndpoints: storeRecord?.returnFeedEndpoints || [],
          encoders: storeRecord?.encoders || [{ id: "enc-1", brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 2, notes: "" }],
          decoders: storeRecord?.decoders || [{ id: "dec-1", brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 6, notes: "" }],
          outboundHost: storeRecord?.outboundHost || "",
          outboundPort: storeRecord?.outboundPort || "",
          inboundHost: storeRecord?.inboundHost || "",
          inboundPort: storeRecord?.inboundPort || "",
          backupOutboundHost: "",
          backupOutboundPort: "",
          backupInboundHost: "",
          backupInboundPort: "",
          lqRequired: storeRecord?.lqRequired ?? false,
          lqPorts: storeRecord?.lqPorts || [
            { letter: "E", label: "Truck AD", notes: "" },
            { letter: "F", label: "Truck Production", notes: "" },
            { letter: "G", label: "Cam Ops", notes: "" },
            { letter: "H", label: "TBD", notes: "" },
          ],
        }}
      />

      <DocToBinderAssist
        open={docAssistOpen}
        onClose={() => setDocAssistOpen(false)}
        state={state}
        onApply={handleDocAssistApply}
      />
    </div>
  );
}
