import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Wand2, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { CommsStructure } from "@/components/command/CommsStructure";
import { ExecutionTimeline } from "@/components/command/ExecutionTimeline";
import { IssuesChanges } from "@/components/command/IssuesChanges";
import { DocumentArchive } from "@/components/command/DocumentArchive";
import { Checklist } from "@/components/command/Checklist";
import { PreAirLock } from "@/components/command/PreAirLock";
import { DiffView } from "@/components/command/DiffView";
import { BinderFormModal, type BinderFormData } from "@/components/command/BinderFormModal";
import { BinderCopilot } from "@/components/command/BinderCopilot";
import { DocToBinderAssist, type DetectedField } from "@/components/command/DocToBinderAssist";
import { AudioPhilosophy } from "@/components/command/AudioPhilosophy";

export default function BinderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const binderId = id || "1";

  const storeRecord = binderStore.getById(binderId);
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

  const [editOpen, setEditOpen] = useState(false);
  const [docAssistOpen, setDocAssistOpen] = useState(false);
  // Preview mode: binder opens read-only by default
  const [previewMode, setPreviewMode] = useState(true);

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

      {/* Preview / Edit mode bar */}
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
        {/* Version selector */}
        {(state.lockHistory?.length > 0) && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">Version</span>
            <select
              className="text-xs bg-secondary border border-border rounded-sm px-2 py-1 text-foreground focus:outline-none focus:border-primary transition-colors"
              defaultValue="current"
            >
              <option value="current">Current (Working)</option>
              {state.lockHistory.map((snap) => (
                <option key={snap.id} value={snap.id}>
                  Lock v{snap.id.replace("lock-v", "")} — {new Date(snap.lockedAt).toLocaleString()}
                </option>
              ))}
            </select>
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
        <CommsStructure
          comms={state.comms}
          onUpdateComm={isReadOnly ? undefined : updateComm}
          onAddComm={isReadOnly ? undefined : addComm}
          onRemoveComm={isReadOnly ? undefined : removeComm}
          readOnly={isReadOnly}
        />
        <ExecutionTimeline />
        <IssuesChanges changes={state.changes} issues={state.issues} />
        <DocumentArchive docs={state.docs} onAddDoc={isReadOnly ? () => {} : addDoc} onRemoveDoc={isReadOnly ? () => {} : removeDoc} onUpdateDoc={isReadOnly ? () => {} : updateDoc} />
        <Checklist
          items={state.checklist}
          onToggle={lockedToggleChecklist}
          onAddItem={isReadOnly ? undefined : addChecklistItem}
          onUpdateItem={isReadOnly ? undefined : updateChecklistItem}
          onRemoveItem={isReadOnly ? undefined : removeChecklistItem}
          readOnly={isReadOnly}
        />
        <DiffView currentState={state} lockHistory={state.lockHistory || []} />
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
