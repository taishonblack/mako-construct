import { useState, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { binderStore } from "@/stores/binder-store";
import { mockBinderDetail } from "@/data/mock-binder-detail";
import { computeReadiness } from "@/lib/readiness-engine";
import { useBinderState } from "@/hooks/use-binder-state";

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
  } = useBinderState(binderId);

  const [editOpen, setEditOpen] = useState(false);

  const isLocked = state.currentLock?.locked ?? false;

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
    ),
    [state.signals, binder.encodersAssigned, state.transport, state.issues, state.returnRequired, state.checklist, state.comms, state.eventHeader]
  );

  const eventStatus = isLocked ? "validated" as const : binder.status === "active" ? "configured" as const : "planning" as const;

  const handleEditSubmit = useCallback((data: BinderFormData) => {
    const changes: string[] = [];
    if (storeRecord) {
      if (data.partner !== storeRecord.partner) changes.push(`Partner updated: ${storeRecord.partner} → ${data.partner}`);
      if (data.isoCount !== storeRecord.isoCount) changes.push(`ISO Count updated: ${storeRecord.isoCount} → ${data.isoCount} (signals regenerated)`);
      if (data.venue !== storeRecord.venue) changes.push(`Venue updated: ${storeRecord.venue} → ${data.venue}`);
      if (data.showType !== storeRecord.showType) changes.push(`Show Type updated: ${storeRecord.showType} → ${data.showType}`);
      if (data.status !== storeRecord.status) changes.push(`Status updated: ${storeRecord.status} → ${data.status}`);
      if (data.returnRequired !== storeRecord.returnRequired) changes.push(`Return Feed updated: ${storeRecord.returnRequired ? "Required" : "Not Required"} → ${data.returnRequired ? "Required" : "Not Required"}`);
    }

    binderStore.update(binderId, {
      title: data.title, league: "NHL", venue: data.venue,
      showType: data.showType === "Other" ? data.customShowType || "Other" : data.showType,
      partner: data.partner, status: data.status, isoCount: data.isoCount,
      returnRequired: data.returnRequired, commercials: data.commercials,
      primaryTransport: data.primaryTransport === "Other" ? data.customPrimaryTransport || "Other" : data.primaryTransport,
      backupTransport: data.backupTransport === "Other" ? data.customBackupTransport || "Other" : data.backupTransport,
      transport: data.primaryTransport === "Other" ? data.customPrimaryTransport || "Other" : data.primaryTransport,
      notes: data.notes, eventTime: data.eventTime, timezone: data.timezone,
      homeTeam: data.homeTeam, awayTeam: data.awayTeam, siteType: data.siteType,
      studioLocation: data.studioLocation, customShowType: data.customShowType,
      customPrimaryTransport: data.customPrimaryTransport, customBackupTransport: data.customBackupTransport,
      customCommercials: data.customCommercials, signalNamingMode: data.signalNamingMode,
      canonicalSignals: data.canonicalSignals, customSignalNames: data.customSignalNames,
      encoderInputsPerUnit: data.encoderInputsPerUnit, encoderCount: data.encoderCount,
      decoderOutputsPerUnit: data.decoderOutputsPerUnit, decoderCount: data.decoderCount,
      autoAllocate: data.autoAllocate,
    });

    update("league", "NHL");
    update("partner", data.partner);
    update("venue", data.venue);
    update("showType", data.showType === "Other" ? data.customShowType || "Other" : data.showType);
    update("eventDate", data.eventDate);
    update("eventTime", data.eventTime);
    update("timezone", data.timezone);
    update("homeTeam", data.homeTeam);
    update("awayTeam", data.awayTeam);
    update("siteType", data.siteType);
    update("returnRequired", data.returnRequired);
    update("commercials", data.commercials);

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
    navigate("/containers");
  }, [binderId, navigate]);

  const handleTransportChange = useCallback((field: "primaryTransport" | "backupTransport", value: string) => {
    if (isLocked) return;
    binderStore.update(binderId, { [field]: value, ...(field === "primaryTransport" ? { transport: value } : {}) });
    if (field === "primaryTransport") {
      update("transport", { ...state.transport, primary: { ...state.transport.primary, protocol: value } });
    } else {
      update("transport", { ...state.transport, backup: { ...state.transport.backup, protocol: value } });
    }
  }, [binderId, state.transport, update, isLocked]);

  const lockedSetIsoCount = useCallback((count: number) => { if (!isLocked) setIsoCount(count); }, [isLocked, setIsoCount]);
  const lockedUpdateSignal = useCallback((iso: number, field: keyof import("@/data/mock-signals").Signal, value: string) => {
    if (!isLocked) updateSignal(iso, field, value);
  }, [isLocked, updateSignal]);
  const lockedUpdateSignals = useCallback((updater: (signals: import("@/data/mock-signals").Signal[]) => import("@/data/mock-signals").Signal[]) => {
    if (!isLocked) updateSignals(updater);
  }, [isLocked, updateSignals]);
  const lockedToggleChecklist = useCallback((id: string) => { if (!isLocked) toggleChecklist(id); }, [isLocked, toggleChecklist]);

  return (
    <div className="relative">
      <CommandHeader
        eventName={binder.title}
        status={eventStatus}
        readiness={report.level}
        reasons={report.reasons}
        onEdit={isLocked ? undefined : () => setEditOpen(true)}
        locked={isLocked}
        lockVersion={state.currentLock?.version}
      />

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        <Link to="/containers"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3 h-3" /> Productions
        </Link>

        <EventCommandHeader
          data={state.eventHeader}
          onChange={isLocked ? () => {} : updateEventHeader}
          readOnly={isLocked}
          onGenerateTxRx={isLocked ? undefined : generateTxRx}
        />

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
          onReturnRequiredChange={(v) => !isLocked && update("returnRequired", v)}
          commercials={state.commercials}
          onCommercialsChange={(v) => !isLocked && update("commercials", v)}
          onFieldChange={(field, value) => !isLocked && update(field as keyof typeof state, value)}
          primaryTransport={storeRecord?.primaryTransport || binder.transport}
          backupTransport={storeRecord?.backupTransport || binder.backupTransport}
          onTransportChange={isLocked ? undefined : handleTransportChange}
        />

        <SignalMatrix
          signals={state.signals} report={report}
          onUpdateSignal={lockedUpdateSignal}
          onUpdateSignals={lockedUpdateSignals}
          topology={state.topology}
        />
        <TransportProfile config={state.transport} returnRequired={state.returnRequired} />
        <CommsStructure
          comms={state.comms}
          onUpdateComm={isLocked ? undefined : updateComm}
          onAddComm={isLocked ? undefined : addComm}
          onRemoveComm={isLocked ? undefined : removeComm}
          readOnly={isLocked}
        />
        <ExecutionTimeline />
        <IssuesChanges changes={state.changes} issues={state.issues} />
        <DocumentArchive docs={state.docs} onAddDoc={isLocked ? () => {} : addDoc} onRemoveDoc={isLocked ? () => {} : removeDoc} onUpdateDoc={isLocked ? () => {} : updateDoc} />
        <Checklist items={state.checklist} onToggle={lockedToggleChecklist} />

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
        }}
      />
    </div>
  );
}
