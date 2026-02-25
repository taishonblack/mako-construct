import { useMemo, useRef, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import type { SignalRoute, HopNode, NodeMetrics } from "@/stores/route-store";
import type { FlowNode, NodeKind } from "./FlowNodeCard";
import { FlowNodeCard } from "./FlowNodeCard";
import { NodeConnector } from "./NodeConnector";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatMetricLine } from "@/hooks/use-simulated-metrics";
import type { NodeHealthStatus } from "@/hooks/use-simulated-metrics";

interface Props {
  route: SignalRoute;
  onNodeClick?: (routeId: string, section: NodeKind | string) => void;
  trace?: boolean;
  onAddHop?: (routeId: string, linkFrom: string, linkTo: string) => void;
  metricsMap?: Record<string, NodeMetrics>;
}

function buildNodes(r: SignalRoute): { nodes: FlowNode[]; hopInsertions: Map<number, HopNode[]> } {
  const has = (v: string | undefined | null) => !!v && v.trim() !== "";

  const canonicalNodes: FlowNode[] = [
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

  // Map hops to the connector index after each canonical node
  // Links are stored as from→to, we map them to the connector after the "from" node
  const hopInsertions = new Map<number, HopNode[]>();
  if (r.links) {
    const stageOrder = canonicalNodes.map(n => n.kind);
    for (const link of r.links) {
      if (link.hops.length === 0) continue;
      const fromIdx = stageOrder.indexOf(link.from as NodeKind);
      if (fromIdx >= 0) {
        hopInsertions.set(fromIdx, link.hops);
      }
    }
  }

  return { nodes: canonicalNodes, hopInsertions };
}

function overallHealth(nodes: FlowNode[], hops: HopNode[]): "ok" | "warn" | "error" {
  const allStatuses = [...nodes.map(n => n.status), ...hops.map(h => h.status)];
  if (allStatuses.some((s) => s === "error" || s === "offline")) return "error";
  if (allStatuses.some((s) => s === "warn" || s === "unknown")) return "warn";
  return "ok";
}

const HEALTH_CHIP: Record<string, { label: string; cls: string }> = {
  ok: { label: "Healthy", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  warn: { label: "Partial", cls: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
  error: { label: "Down", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

function HopMiniCard({ hop, trace, metricLine, onClick }: { hop: HopNode; trace?: boolean; metricLine?: string | null; onClick?: () => void }) {
  const STATUS_DOT: Record<string, string> = {
    ok: "bg-emerald-500", warn: "bg-amber-400", error: "bg-red-500",
    offline: "bg-muted-foreground/40", unknown: "bg-muted-foreground/20",
  };
  const showMetric = metricLine && (hop.status === "warn" || hop.status === "error");
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start text-left rounded border bg-secondary/60 p-2 min-w-[120px] max-w-[150px] shrink-0 transition-all duration-200",
        "hover:border-primary/50 cursor-pointer",
        trace ? "glow-trace-node border-primary/30" : "border-border",
        hop.status === "error" && "border-red-500/40",
        hop.status === "warn" && "border-amber-400/30"
      )}
    >
      <span className={cn("absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full", STATUS_DOT[hop.status])} />
      <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground font-semibold">HOP</span>
      <span className="text-[10px] font-mono font-semibold text-foreground mt-0.5 truncate w-full">{hop.label}</span>
      <span className="text-[9px] text-muted-foreground truncate w-full">{hop.subtype}</span>
      {showMetric && (
        <span className={cn(
          "text-[8px] font-mono mt-0.5 truncate w-full",
          hop.status === "error" ? "text-red-400" : "text-amber-400"
        )}>
          {metricLine}
        </span>
      )}
    </button>
  );
}

function AddHopButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="flex items-center justify-center w-5 h-5 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground/40 hover:border-primary/50 hover:text-primary transition-colors shrink-0"
      title="Add hop"
    >
      <Plus className="w-2.5 h-2.5" />
    </button>
  );
}

export function RouteFlowRow({ route, onNodeClick, trace, onAddHop, metricsMap }: Props) {
  const isMobile = useIsMobile();
  const { nodes, hopInsertions } = useMemo(() => buildNodes(route), [route]);
  const allHops = useMemo(() => Array.from(hopInsertions.values()).flat(), [hopInsertions]);
  const health = useMemo(() => overallHealth(nodes, allHops), [nodes, allHops]);
  const chip = HEALTH_CHIP[health];
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Build flat display list for mobile carousel
  const flatItems = useMemo(() => {
    const items: { type: "node" | "hop"; node?: FlowNode; hop?: HopNode; linkFrom?: string; linkTo?: string }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      items.push({ type: "node", node: nodes[i] });
      const hops = hopInsertions.get(i);
      if (hops) {
        hops.forEach(h => items.push({ type: "hop", hop: h }));
      }
    }
    return items;
  }, [nodes, hopInsertions]);

  useEffect(() => {
    if (!isMobile || !scrollRef.current) return;
    const el = scrollRef.current;
    const handleScroll = () => {
      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 12
        : 272;
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveIndex(Math.min(idx, flatItems.length - 1));
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isMobile, flatItems.length]);

  const getNodeMetricLine = (kind: NodeKind) => {
    if (!metricsMap) return null;
    const key = `${route.id}-${kind}`;
    const m = metricsMap[key];
    if (!m) return null;
    const node = nodes.find(n => n.kind === kind);
    if (!node) return null;
    return formatMetricLine(m, node.status as NodeHealthStatus);
  };

  const getHopMetricLine = (hop: HopNode) => {
    if (!metricsMap) return null;
    const m = metricsMap[`${route.id}-hop-${hop.id}`];
    if (!m) return null;
    return formatMetricLine(m, hop.status as NodeHealthStatus);
  };

  const handleNodeClick = (kind: NodeKind) => {
    const sectionMap: Record<NodeKind, string> = {
      source: "source", encoder: "encoder", transport: "transport",
      cloud: "transport", decoder: "decoder", router: "router", output: "alias",
    };
    onNodeClick?.(route.id, sectionMap[kind]);
  };

  const handleHopClick = (hop: HopNode) => {
    onNodeClick?.(route.id, "hops");
  };

  const getLinkAtIndex = (nodeIndex: number) => {
    const stageOrder = nodes.map(n => n.kind);
    if (nodeIndex < stageOrder.length - 1) {
      return { from: stageOrder[nodeIndex], to: stageOrder[nodeIndex + 1] };
    }
    return null;
  };

  if (isMobile) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <span className="text-sm font-mono font-bold text-foreground">{route.routeName}</span>
            <span className="text-xs text-muted-foreground ml-2">{route.alias.productionName || "—"}</span>
          </div>
          <Badge variant="outline" className={cn("text-[10px] border shrink-0", chip.cls)}>
            {chip.label}
          </Badge>
        </div>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 -mx-1 px-1"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
        >
          {flatItems.map((item, i) => (
            <div key={i} className="snap-start shrink-0" style={{ width: "85%" }}>
              {item.type === "node" && item.node && (
                <FlowNodeCard node={item.node} trace={trace} metricLine={getNodeMetricLine(item.node.kind)} onClick={() => handleNodeClick(item.node!.kind)} />
              )}
              {item.type === "hop" && item.hop && (
                <HopMiniCard hop={item.hop} trace={trace} metricLine={getHopMetricLine(item.hop)} onClick={() => handleHopClick(item.hop!)} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-1">
          {flatItems.map((_, i) => (
            <span key={i} className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === activeIndex ? "bg-primary" : "bg-muted-foreground/30")} />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: horizontal pipeline row with hops inline
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 min-w-0">
      <div className="shrink-0 w-[100px] min-w-0">
        <div className="text-sm font-mono font-bold text-foreground truncate">{route.routeName}</div>
        <div className="text-[10px] text-muted-foreground truncate">{route.alias.productionName || "—"}</div>
        <Badge variant="outline" className={cn("text-[9px] border mt-1", chip.cls)}>
          {chip.label}
        </Badge>
      </div>
      <div className="flex-1 min-w-0 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {nodes.map((node, i) => {
            const hops = hopInsertions.get(i);
            const link = getLinkAtIndex(i);
            return (
              <div key={node.kind + i} className="flex items-center">
                <FlowNodeCard node={node} trace={trace} metricLine={getNodeMetricLine(node.kind)} onClick={() => handleNodeClick(node.kind)} />
                {i < nodes.length - 1 && (
                  <div className="flex items-center gap-0">
                    <NodeConnector trace={trace} />
                    {hops && hops.length > 0 && (
                      <>
                        {hops.length <= 2 ? (
                          hops.map((hop) => (
                            <div key={hop.id} className="flex items-center">
                              <HopMiniCard hop={hop} trace={trace} metricLine={getHopMetricLine(hop)} onClick={() => handleHopClick(hop)} />
                              <NodeConnector trace={trace} />
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center">
                            <HopMiniCard hop={hops[0]} trace={trace} metricLine={getHopMetricLine(hops[0])} onClick={() => handleHopClick(hops[0])} />
                            <button
                              type="button"
                              onClick={() => onNodeClick?.(route.id, "hops")}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors mx-0.5"
                            >
                              +{hops.length - 1}
                            </button>
                            <NodeConnector trace={trace} />
                          </div>
                        )}
                      </>
                    )}
                    {onAddHop && !hops?.length && (
                      <div className="flex items-center -mx-1">
                        <AddHopButton onClick={() => link && onAddHop(route.id, link.from, link.to)} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
