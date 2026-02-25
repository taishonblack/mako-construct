import { useState, useMemo, useCallback } from "react";
import { Zap, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { SignalRoute } from "@/stores/route-store";
import type { NodeKind } from "./FlowNodeCard";
import { RouteFlowRow } from "./RouteFlowRow";
import { cn } from "@/lib/utils";
import { useSimulatedMetrics } from "@/hooks/use-simulated-metrics";
import type { NodeHealthStatus } from "@/hooks/use-simulated-metrics";

type HealthFilter = "all" | "ok" | "warn" | "error";

interface Props {
  routes: SignalRoute[];
  onNodeClick?: (routeId: string, section: NodeKind | string) => void;
  onAddHop?: (routeId: string, linkFrom: string, linkTo: string) => void;
}

function computeRouteHealth(r: SignalRoute): "ok" | "warn" | "error" {
  // Use manual health status if set
  if (r.health) {
    if (r.health.status === "down") return "error";
    if (r.health.status === "warn") return "warn";
  }
  const has = (v: string | undefined | null) => !!v && v.trim() !== "";
  const problems: string[] = [];
  if (!has(r.transport.type)) problems.push("transport");
  if (!has(r.encoder.deviceName)) problems.push("encoder");
  if (!has(r.decoder.deviceName)) problems.push("decoder");
  if (!has(r.alias.productionName)) problems.push("alias");
  // Check hop health
  if (r.links) {
    for (const link of r.links) {
      for (const hop of link.hops) {
        if (hop.status === "error" || hop.status === "offline") return "error";
        if (hop.status === "warn") problems.push("hop");
      }
    }
  }
  if (problems.length >= 2) return "error";
  if (problems.length >= 1) return "warn";
  return "ok";
}

const FILTER_OPTIONS: { value: HealthFilter; label: string; cls: string }[] = [
  { value: "all", label: "All", cls: "" },
  { value: "ok", label: "Healthy", cls: "text-emerald-400" },
  { value: "warn", label: "Warn", cls: "text-amber-400" },
  { value: "error", label: "Down", cls: "text-red-400" },
];

export function TransportView({ routes, onNodeClick, onAddHop }: Props) {
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [traceMode, setTraceMode] = useState(false);

  // Build node status list for simulated metrics
  const metricNodes = useMemo(() => {
    const nodes: { key: string; status: NodeHealthStatus }[] = [];
    const STAGES: NodeKind[] = ["source", "encoder", "transport", "cloud", "decoder", "router", "output"];
    for (const r of routes) {
      for (const stage of STAGES) {
        const has = (v: string | undefined | null) => !!v && v.trim() !== "";
        let status: NodeHealthStatus = "unknown";
        if (stage === "source") status = has(r.signalSource.signalName) ? "ok" : "unknown";
        else if (stage === "encoder") status = has(r.encoder.deviceName) ? "ok" : "unknown";
        else if (stage === "transport") status = r.transport.type ? "ok" : "offline";
        else if (stage === "cloud") status = r.transport.cloudRelayName ? "ok" : "unknown";
        else if (stage === "decoder") status = has(r.decoder.deviceName) ? "ok" : "unknown";
        else if (stage === "router") status = r.routerMapping.router ? "ok" : "unknown";
        else if (stage === "output") status = has(r.alias.productionName) ? "ok" : "unknown";
        // Override with route health
        if (r.health?.status === "down" && (stage === "transport" || stage === "encoder")) status = "error";
        if (r.health?.status === "warn" && stage === "transport") status = "warn";
        nodes.push({ key: `${r.id}-${stage}`, status });
      }
      // Add hops
      if (r.links) {
        for (const link of r.links) {
          for (const hop of link.hops) {
            nodes.push({ key: `${r.id}-hop-${hop.id}`, status: hop.status as NodeHealthStatus });
          }
        }
      }
    }
    return nodes;
  }, [routes]);

  const metricsMap = useSimulatedMetrics(metricNodes, 10000);

  const routesWithHealth = useMemo(
    () => routes.map((r) => ({ route: r, health: computeRouteHealth(r) })),
    [routes]
  );

  const filteredRoutes = useMemo(
    () => healthFilter === "all"
      ? routesWithHealth
      : routesWithHealth.filter((rh) => rh.health === healthFilter),
    [routesWithHealth, healthFilter]
  );

  const counts = useMemo(() => {
    const c = { ok: 0, warn: 0, error: 0 };
    routesWithHealth.forEach((rh) => c[rh.health]++);
    return c;
  }, [routesWithHealth]);

  if (routes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        No routes defined.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-muted-foreground mr-1" />
          {FILTER_OPTIONS.map((opt) => {
            const isActive = healthFilter === opt.value;
            const count = opt.value === "all" ? routes.length : counts[opt.value as keyof typeof counts];
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setHealthFilter(opt.value)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5",
                  isActive
                    ? "bg-secondary border-primary/40 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <span className={opt.cls}>{opt.label}</span>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 min-w-[18px] justify-center">
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <Zap className={cn("w-3.5 h-3.5 transition-colors", traceMode ? "text-primary" : "text-muted-foreground")} />
          <span className="text-[11px] text-muted-foreground">Trace</span>
          <Switch
            checked={traceMode}
            onCheckedChange={setTraceMode}
            className="scale-75 origin-left"
          />
        </label>
      </div>

      {/* Route flow rows */}
      {filteredRoutes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No routes match this filter.
        </div>
      ) : (
        filteredRoutes.map(({ route }) => (
          <RouteFlowRow
            key={route.id}
            route={route}
            onNodeClick={onNodeClick}
            trace={traceMode}
            onAddHop={onAddHop}
            metricsMap={metricsMap}
          />
        ))
      )}
    </div>
  );
}
