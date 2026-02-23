import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { mockBinderDetail } from "@/data/mock-binder-detail";
import { mockTransport, mockChanges, mockIssues, mockDocs } from "@/data/mock-phase5";
import { generateSignals } from "@/data/mock-signals";
import { computeReadiness } from "@/lib/readiness-engine";

import { CommandHeader } from "@/components/command/CommandHeader";
import { ProductionDefinition } from "@/components/command/ProductionDefinition";
import { SignalMatrix } from "@/components/command/SignalMatrix";
import { TransportProfile } from "@/components/command/TransportProfile";
import { ExecutionTimeline } from "@/components/command/ExecutionTimeline";
import { IssuesChanges } from "@/components/command/IssuesChanges";
import { DocumentArchive } from "@/components/command/DocumentArchive";

export default function BinderDetail() {
  const { id } = useParams();
  const binder = mockBinderDetail;

  // Editable state
  const [isoCount, setIsoCount] = useState(binder.isoCount);
  const [returnRequired, setReturnRequired] = useState(binder.returnFeed);
  const [commercials, setCommercials] = useState<string>("local-insert");

  // Computed
  const signals = useMemo(() => generateSignals(isoCount), [isoCount]);
  const report = useMemo(
    () => computeReadiness(signals, binder.encodersAssigned, mockTransport, mockIssues, returnRequired),
    [signals, binder.encodersAssigned, returnRequired]
  );

  // Map status
  const eventStatus = binder.status === "active" ? "configured" as const : "planning" as const;

  return (
    <div className="relative">
      {/* Persistent command header */}
      <CommandHeader
        eventName={binder.title}
        status={eventStatus}
        readiness={report.level}
        reasons={report.reasons}
      />

      {/* Command Surface */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {/* Back link */}
        <Link
          to="/binders"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Binder Library
        </Link>

        {/* Section 1: Production Definition */}
        <ProductionDefinition
          league="NBA"
          venue={binder.venue}
          partner={binder.partner}
          showType="Live Game"
          eventDate={binder.eventDate}
          isoCount={isoCount}
          onIsoCountChange={setIsoCount}
          returnRequired={returnRequired}
          onReturnRequiredChange={setReturnRequired}
          commercials={commercials}
          onCommercialsChange={setCommercials}
        />

        {/* Section 2: Signal Configuration Matrix */}
        <SignalMatrix signals={signals} report={report} />

        {/* Section 3: Transport Profile */}
        <TransportProfile config={mockTransport} returnRequired={returnRequired} />

        {/* Section 4: Execution Timeline */}
        <ExecutionTimeline />

        {/* Section 5: Issues & Pivots */}
        <IssuesChanges changes={mockChanges} issues={mockIssues} />

        {/* Section 6: Document Archive */}
        <DocumentArchive docs={mockDocs} />
      </div>
    </div>
  );
}
