import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { SignalRoute } from "@/stores/route-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  route: SignalRoute;
  isSelected?: boolean;
  onSelect: (id: string) => void;
}

function ChainStep({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 w-16">{label}</span>
      <span className="text-[10px] font-mono text-foreground/70 truncate min-w-0">{value || "—"}</span>
    </div>
  );
}

export function RouteChain({ route, isSelected, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);
  const r = route;

  return (
    <button
      type="button"
      onClick={() => onSelect(r.id)}
      className={cn(
        "w-full text-left rounded-lg border bg-card p-4 transition-all duration-150 hover:border-primary/40",
        isSelected ? "border-primary/60 glow-red-subtle" : "border-border"
      )}
    >
      {/* Compact header — always visible */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-foreground">{r.routeName}</span>
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
              {r.alias.productionName || "—"}
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {r.signalSource.signalName} — {r.signalSource.location || "Unknown"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-muted-foreground">CR-{r.routerMapping.router || "?"}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Compact summary line */}
      <div className="mt-2 text-[10px] font-mono text-muted-foreground truncate">
        {r.encoder.brand} {r.encoder.deviceName} → {r.transport.type || "—"} → {r.decoder.brand} {r.decoder.deviceName}
      </div>

      {/* Expanded chain (read-only) */}
      {expanded && (
        <div
          className="mt-3 pt-3 border-t border-border space-y-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <ChainStep label="Source" value={`${r.signalSource.signalName} — ${r.signalSource.location}`} />
          <ChainStep label="Encoder" value={`${r.encoder.brand} ${r.encoder.deviceName} Port ${r.encoder.inputPort}`} />
          <ChainStep label="Transport" value={`${r.transport.type} ${r.transport.srtAddress ? r.transport.srtAddress + ":" + r.transport.port : ""}`} />
          {r.transport.cloudRelayName && (
            <ChainStep label="Cloud" value={r.transport.cloudRelayName} />
          )}
          <ChainStep label="Decoder" value={`${r.decoder.brand} ${r.decoder.deviceName} Port ${r.decoder.outputPort}`} />
          <ChainStep label="Router" value={`CR-${r.routerMapping.router} In ${r.routerMapping.inputCrosspoint} → Out ${r.routerMapping.outputCrosspoint}`} />
          <ChainStep label="Alias" value={`${r.alias.engineeringName} → ${r.alias.productionName}`} />
        </div>
      )}
    </button>
  );
}
