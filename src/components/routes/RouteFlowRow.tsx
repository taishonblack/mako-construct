import { useMemo, useRef, useState, useEffect } from "react";
import type { SignalRoute } from "@/stores/route-store";
import type { FlowNode, NodeKind } from "./FlowNodeCard";
import { FlowNodeCard } from "./FlowNodeCard";
import { NodeConnector } from "./NodeConnector";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface Props {
  route: SignalRoute;
  onNodeClick?: (routeId: string, section: NodeKind) => void;
  trace?: boolean;
}

function buildNodes(r: SignalRoute): FlowNode[] {
  const has = (v: string | undefined | null) => !!v && v.trim() !== "";

  return [
    {
      kind: "source",
      title: "Source",
      primary: r.signalSource.signalName || "—",
      secondary: r.signalSource.location || "—",
      status: has(r.signalSource.signalName) ? "ok" : "unknown",
    },
    {
      kind: "encoder",
      title: "Encoder",
      primary: has(r.encoder.deviceName) ? `${r.encoder.brand} ${r.encoder.deviceName}` : "—",
      secondary: `Port ${r.encoder.inputPort}`,
      status: has(r.encoder.deviceName) ? "ok" : "unknown",
    },
    {
      kind: "transport",
      title: "Transport",
      primary: r.transport.type || "—",
      secondary: r.transport.type
        ? `${r.transport.mode || "—"} • :${r.transport.port || "—"}`
        : "Not configured",
      status: r.transport.type ? "ok" : "offline",
    },
    ...(r.transport.cloudRelayName
      ? [{
          kind: "cloud" as NodeKind,
          title: "Cloud",
          primary: r.transport.cloudRelayName,
          secondary: "Cloud Relay",
          status: "ok" as const,
        }]
      : []),
    {
      kind: "decoder",
      title: "Decoder",
      primary: has(r.decoder.deviceName) ? `${r.decoder.brand} ${r.decoder.deviceName}` : "—",
      secondary: `Port ${r.decoder.outputPort}${r.decoder.frameSync ? " • Sync" : ""}`,
      status: has(r.decoder.deviceName) ? "ok" : "unknown",
    },
    {
      kind: "router",
      title: "Router",
      primary: r.routerMapping.router ? `CR-${r.routerMapping.router}` : "—",
      secondary: r.routerMapping.router
        ? `In ${r.routerMapping.inputCrosspoint} → Out ${r.routerMapping.outputCrosspoint}`
        : "Not mapped",
      status: r.routerMapping.router ? "ok" : "unknown",
    },
    {
      kind: "output",
      title: "Output",
      primary: r.alias.productionName || "—",
      secondary: r.alias.engineeringName || "—",
      status: has(r.alias.productionName) ? "ok" : "unknown",
    },
  ];
}

function overallHealth(nodes: FlowNode[]): "ok" | "warn" | "error" {
  if (nodes.some((n) => n.status === "error" || n.status === "offline")) return "error";
  if (nodes.some((n) => n.status === "warn" || n.status === "unknown")) return "warn";
  return "ok";
}

const HEALTH_CHIP: Record<string, { label: string; cls: string }> = {
  ok: { label: "Healthy", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  warn: { label: "Partial", cls: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
  error: { label: "Down", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export function RouteFlowRow({ route, onNodeClick, trace }: Props) {
  const isMobile = useIsMobile();
  const nodes = useMemo(() => buildNodes(route), [route]);
  const health = useMemo(() => overallHealth(nodes), [nodes]);
  const chip = HEALTH_CHIP[health];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Scroll-snap observer for mobile dots
  useEffect(() => {
    if (!isMobile || !scrollRef.current) return;
    const el = scrollRef.current;
    const handleScroll = () => {
      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 12 // gap
        : 272;
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveIndex(Math.min(idx, nodes.length - 1));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isMobile, nodes.length]);

  const handleNodeClick = (kind: NodeKind) => {
    // Map "cloud" clicks to "transport" drawer section, "output" to "alias"
    const sectionMap: Record<NodeKind, string> = {
      source: "source",
      encoder: "encoder",
      transport: "transport",
      cloud: "transport",
      decoder: "decoder",
      router: "router",
      output: "alias",
    };
    onNodeClick?.(route.id, sectionMap[kind] as NodeKind);
  };

  if (isMobile) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        {/* Route header */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <span className="text-sm font-mono font-bold text-foreground">{route.routeName}</span>
            <span className="text-xs text-muted-foreground ml-2">{route.alias.productionName || "—"}</span>
          </div>
          <Badge variant="outline" className={cn("text-[10px] border shrink-0", chip.cls)}>
            {chip.label}
          </Badge>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {nodes.map((node, i) => (
            <div key={node.kind + i} className="snap-start shrink-0" style={{ width: "85%" }}>
              <FlowNodeCard node={node} onClick={() => handleNodeClick(node.kind)} />
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1">
          {nodes.map((_, i) => (
            <span
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                i === activeIndex ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: horizontal pipeline row
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 min-w-0">
      {/* Route identity */}
      <div className="shrink-0 w-[100px] min-w-0">
        <div className="text-sm font-mono font-bold text-foreground truncate">{route.routeName}</div>
        <div className="text-[10px] text-muted-foreground truncate">{route.alias.productionName || "—"}</div>
        <Badge variant="outline" className={cn("text-[9px] border mt-1", chip.cls)}>
          {chip.label}
        </Badge>
      </div>

      {/* Node rail */}
      <div className="flex-1 min-w-0 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {nodes.map((node, i) => (
            <div key={node.kind + i} className="flex items-center">
              <FlowNodeCard node={node} trace={trace} onClick={() => handleNodeClick(node.kind)} />
              {i < nodes.length - 1 && <NodeConnector trace={trace} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
