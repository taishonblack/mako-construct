/**
 * Compact card for canonical (hop-based) routes in the topology grid.
 */
import type { CanonicalRoute, RouteStatus, CloudTransportMeta, ReceiverMeta, EncoderMeta } from "@/stores/route-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CHIP: Record<RouteStatus, { label: string; cls: string }> = {
  healthy: { label: "Healthy", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  warn: { label: "Warn", cls: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
  down: { label: "Down", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  unknown: { label: "—", cls: "bg-muted-foreground/15 text-muted-foreground border-border" },
};

interface Props {
  route: CanonicalRoute;
  isSelected?: boolean;
  onSelect: (id: string) => void;
}

export function CanonicalRouteCard({ route, isSelected, onSelect }: Props) {
  const chip = STATUS_CHIP[route.status];
  const encoderHop = route.hops.find(h => h.hop_type === "encoder");
  const cloudHop = route.hops.find(h => h.hop_type === "cloud_transport");
  const rxHop = route.hops.find(h => h.hop_type === "receiver");

  const encoderMeta = encoderHop?.meta as EncoderMeta | undefined;
  const cloudMeta = cloudHop?.meta as CloudTransportMeta | undefined;
  const rxMeta = rxHop?.meta as ReceiverMeta | undefined;

  return (
    <button
      type="button"
      onClick={() => onSelect(route.id)}
      className={cn(
        "w-full text-left rounded-lg border bg-card p-4 transition-all duration-150 hover:border-primary/40",
        isSelected ? "border-primary/60 glow-red-subtle" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-foreground">ISO {route.iso_number}</span>
            <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
              {cloudMeta?.tx_label || route.route_name}
            </Badge>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[9px] border shrink-0", chip.cls)}>
          {chip.label}
        </Badge>
      </div>

      {/* Compact hop chain */}
      <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-muted-foreground overflow-hidden">
        {route.hops.map((hop, i) => (
          <span key={hop.id} className="flex items-center gap-1 shrink-0">
            {i > 0 && <span className="text-border">→</span>}
            <span className={cn(
              hop.status === "down" && "text-red-400",
              hop.status === "warn" && "text-amber-400",
            )}>
              {hop.label.length > 12 ? hop.label.slice(0, 12) + "…" : hop.label}
            </span>
          </span>
        ))}
      </div>

      {/* RX assignment */}
      <div className="mt-1.5 text-[10px] text-muted-foreground">
        RX: <span className={cn("font-mono", rxMeta?.rx_label === "Unassigned" ? "text-amber-400" : "text-foreground")}>{rxMeta?.rx_label || "Unassigned"}</span>
      </div>
    </button>
  );
}
