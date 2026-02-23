import { useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { binderStore } from "@/stores/binder-store";
import { mockBinderDetail } from "@/data/mock-binder-detail";
import { computeReadiness } from "@/lib/readiness-engine";
import { useBinderState } from "@/hooks/use-binder-state";

import { CommandHeader } from "@/components/command/CommandHeader";
import { CommandBrief } from "@/components/command/CommandBrief";
import { ProductionDefinition } from "@/components/command/ProductionDefinition";
import { SignalMatrix } from "@/components/command/SignalMatrix";
import { TransportProfile } from "@/components/command/TransportProfile";
import { CommsStructure } from "@/components/command/CommsStructure";
import { ExecutionTimeline } from "@/components/command/ExecutionTimeline";
import { IssuesChanges } from "@/components/command/IssuesChanges";
import { DocumentArchive } from "@/components/command/DocumentArchive";
import { Checklist } from "@/components/command/Checklist";
import { BinderFormModal, type BinderFormData } from "@/components/command/BinderFormModal";

export default function BinderDetail() {
  const { id } = useParams();
  const binderId = id || "1";

  // Try store first, fall back to mock
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

  const { state, update, setIsoCount, updateSignal, toggleChecklist, addDoc, removeDoc, updateDoc } = useBinderState(binderId);

  const [editOpen, setEditOpen] = useState(false);

  const report = useMemo(
    () => computeReadiness(
      state.signals,
      binder.encodersAssigned ?? 10,
      state.transport,
      state.issues,
      state.returnRequired,
      state.checklist,
    ),
    [state.signals, binder.encodersAssigned, state.transport, state.issues, state.returnRequired, state.checklist]
  );

  const eventStatus = binder.status === "active" ? "configured" as const : "planning" as const;

  const handleEditSubmit = useCallback((data: BinderFormData) => {
    // Build changelog entries for changed fields
    const changes: string[] = [];
    if (storeRecord) {
      if (data.partner !== storeRecord.partner) changes.push(`Partner updated: ${storeRecord.partner} → ${data.partner}`);
      if (data.isoCount !== storeRecord.isoCount) changes.push(`ISO Count updated: ${storeRecord.isoCount} → ${data.isoCount} (signals regenerated)`);
      if (data.venue !== storeRecord.venue) changes.push(`Venue updated: ${storeRecord.venue} → ${data.venue}`);
      if (data.league !== storeRecord.league) changes.push(`League updated: ${storeRecord.league} → ${data.league}`);
      if (data.showType !== storeRecord.showType) changes.push(`Show Type updated: ${storeRecord.showType} → ${data.showType}`);
      if (data.status !== storeRecord.status) changes.push(`Status updated: ${storeRecord.status} → ${data.status}`);
      if (data.returnRequired !== storeRecord.returnRequired) changes.push(`Return Feed updated: ${storeRecord.returnRequired ? "Required" : "Not Required"} → ${data.returnRequired ? "Required" : "Not Required"}`);
    }

    // Update store record
    binderStore.update(binderId, {
      title: data.title,
      league: data.league,
      venue: data.venue,
      showType: data.showType,
      partner: data.partner,
      status: data.status,
      isoCount: data.isoCount,
      returnRequired: data.returnRequired,
      commercials: data.commercials,
      primaryTransport: data.primaryTransport,
      backupTransport: data.backupTransport,
      transport: data.primaryTransport,
      notes: data.notes,
    });

    // Update local binder state
    update("league", data.league);
    update("partner", data.partner);
    update("venue", data.venue);
    update("showType", data.showType);
    update("eventDate", data.eventDate);
    update("returnRequired", data.returnRequired);
    update("commercials", data.commercials);

    // Handle ISO count change
    if (data.isoCount !== state.isoCount) {
      setIsoCount(data.isoCount);
    }

    // Write changelog entries
    if (changes.length > 0) {
      const newChanges = changes.map((label, i) => ({
        id: `ch-${Date.now()}-${i}`,
        label,
        timestamp: new Date().toISOString(),
        status: "confirmed" as const,
        author: "System",
      }));
      update("changes", [...newChanges, ...state.changes]);
    }
  }, [binderId, storeRecord, state, update, setIsoCount]);

  return (
    <div className="relative">
      <CommandHeader
        eventName={binder.title}
        status={eventStatus}
        readiness={report.level}
        reasons={report.reasons}
        onEdit={() => setEditOpen(true)}
      />

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        <Link
          to="/containers"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Containers
        </Link>

        <CommandBrief
          venue={state.venue}
          partner={state.partner}
          isoCount={state.isoCount}
          report={report}
          issues={state.issues}
          changes={state.changes}
          checklist={state.checklist}
        />

        <ProductionDefinition
          league={state.league}
          venue={state.venue}
          partner={state.partner}
          showType={state.showType}
          eventDate={state.eventDate}
          isoCount={state.isoCount}
          onIsoCountChange={setIsoCount}
          returnRequired={state.returnRequired}
          onReturnRequiredChange={(v) => update("returnRequired", v)}
          commercials={state.commercials}
          onCommercialsChange={(v) => update("commercials", v)}
          onFieldChange={(field, value) => update(field as keyof typeof state, value)}
        />

        <SignalMatrix signals={state.signals} report={report} onUpdateSignal={updateSignal} />
        <TransportProfile config={state.transport} returnRequired={state.returnRequired} />
        <CommsStructure comms={state.comms} />
        <ExecutionTimeline />
        <IssuesChanges changes={state.changes} issues={state.issues} />
        <DocumentArchive docs={state.docs} onAddDoc={addDoc} onRemoveDoc={removeDoc} onUpdateDoc={updateDoc} />
        <Checklist items={state.checklist} onToggle={toggleChecklist} />
      </div>

      <BinderFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        mode="edit"
        oldIsoCount={state.isoCount}
        initial={{
          title: binder.title,
          league: storeRecord?.league || state.league,
          containerId: storeRecord?.containerId || "",
          eventDate: state.eventDate,
          venue: state.venue,
          showType: state.showType,
          partner: state.partner,
          status: binder.status,
          isoCount: state.isoCount,
          returnRequired: state.returnRequired,
          commercials: state.commercials,
          primaryTransport: storeRecord?.primaryTransport || binder.transport,
          backupTransport: storeRecord?.backupTransport || binder.backupTransport,
          notes: storeRecord?.notes || "",
        }}
      />
    </div>
  );
}
