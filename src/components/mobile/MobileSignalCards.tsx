import { useState } from "react";
import { ChevronDown, ChevronUp, Link2 } from "lucide-react";
import type { Signal } from "@/data/mock-signals";
import type { SignalRoute } from "@/stores/route-store";

function SignalStatusBadge({ signal }: { signal: Signal }) {
  const hasOnsite = !!signal.encoderInput;
  const hasHQ = !!signal.decoderOutput || !!signal.hqPatchCustomLabel;

  if (hasOnsite && hasHQ) {
    return <span className="text-[9px] tracking-wider uppercase text-emerald-400 font-medium">Configured</span>;
  }
  if (hasOnsite || hasHQ || !!signal.productionAlias) {
    return <span className="text-[9px] tracking-wider uppercase text-amber-400 font-medium">Partial</span>;
  }
  return <span className="text-[9px] tracking-wider uppercase text-primary font-medium">Blocked</span>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-[10px] tracking-wider uppercase text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-mono text-foreground text-right truncate">{value}</span>
    </div>
  );
}

interface MobileSignalCardsProps {
  signals: Signal[];
  routes?: SignalRoute[];
}

export function MobileSignalCards({ signals, routes = [] }: MobileSignalCardsProps) {
  const [expandedIso, setExpandedIso] = useState<number | null>(null);

  const configuredCount = signals.filter(s => !!s.encoderInput && (!!s.decoderOutput || !!s.hqPatchCustomLabel)).length;

  return (
    <div className="space-y-2">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-[10px] tracking-wider uppercase text-muted-foreground">
          {configuredCount}/{signals.length} configured
        </span>
        <span className={`text-[10px] font-mono font-medium ${configuredCount === signals.length ? "text-emerald-400" : "text-foreground"}`}>
          {signals.length} ISOs
        </span>
      </div>

      {signals.map((signal) => {
        const isExpanded = expandedIso === signal.iso;
        const linkedRoute = signal.linkedRouteId ? routes.find(r => r.id === signal.linkedRouteId) : null;

        return (
          <div key={signal.iso} className="steel-panel overflow-hidden">
            {/* Collapsed row */}
            <button
              onClick={() => setExpandedIso(isExpanded ? null : signal.iso)}
              className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <span className="text-xs font-mono font-semibold text-primary w-8 shrink-0">
                {signal.iso}
              </span>
              <span className="text-sm text-foreground flex-1 truncate">
                {signal.productionAlias || <span className="text-muted-foreground italic">Unassigned</span>}
              </span>
              {linkedRoute && <Link2 className="w-3 h-3 text-sky-400 shrink-0" />}
              <SignalStatusBadge signal={signal} />
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div className="px-3 pb-3 pt-0 border-t border-border/50">
                <div className="mt-2">
                  <DetailRow label="Onsite TX" value={signal.encoderInput} />
                  <DetailRow label="HQ RX" value={signal.decoderOutput || signal.hqPatchCustomLabel || ""} />
                  <DetailRow label="TX Name" value={signal.txName || ""} />
                  <DetailRow label="RX Name" value={signal.rxName || ""} />
                  <DetailRow label="Transport" value={signal.transport} />
                  <DetailRow label="Destination" value={signal.destination} />
                  {linkedRoute && (
                    <DetailRow label="Linked Route" value={linkedRoute.routeName} />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
