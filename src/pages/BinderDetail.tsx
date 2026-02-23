import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { mockBinderDetail } from "@/data/mock-binder-detail";
import { mockDocs } from "@/data/mock-phase5";
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

export default function BinderDetail() {
  const { id } = useParams();
  const binderId = id || "1";
  const binder = mockBinderDetail;

  const { state, update, setIsoCount, updateSignal, toggleChecklist } = useBinderState(binderId);

  const report = useMemo(
    () => computeReadiness(
      state.signals,
      binder.encodersAssigned,
      state.transport,
      state.issues,
      state.returnRequired,
      state.checklist,
    ),
    [state.signals, binder.encodersAssigned, state.transport, state.issues, state.returnRequired, state.checklist]
  );

  const eventStatus = binder.status === "active" ? "configured" as const : "planning" as const;

  return (
    <div className="relative">
      <CommandHeader
        eventName={binder.title}
        status={eventStatus}
        readiness={report.level}
        reasons={report.reasons}
      />

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {/* Breadcrumb */}
        <Link
          to="/containers"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Containers
        </Link>

        {/* Section 1: Command Brief */}
        <CommandBrief
          venue={state.venue}
          partner={state.partner}
          isoCount={state.isoCount}
          report={report}
          issues={state.issues}
          changes={state.changes}
          checklist={state.checklist}
        />

        {/* Section 2: Production Definition */}
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
        />

        {/* Section 3: Signal Configuration Matrix */}
        <SignalMatrix signals={state.signals} report={report} onUpdateSignal={updateSignal} />

        {/* Section 4: Transport Profile */}
        <TransportProfile config={state.transport} returnRequired={state.returnRequired} />

        {/* Section 5: Comms Structure */}
        <CommsStructure comms={state.comms} />

        {/* Section 6: Execution Timeline */}
        <ExecutionTimeline />

        {/* Section 7: Issues & Pivots */}
        <IssuesChanges changes={state.changes} issues={state.issues} />

        {/* Section 8: Document Archive */}
        <DocumentArchive docs={mockDocs} />

        {/* Section 9: Checklist */}
        <Checklist items={state.checklist} onToggle={toggleChecklist} />
      </div>
    </div>
  );
}
