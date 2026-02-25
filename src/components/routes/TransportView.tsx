import { useState, useMemo, useCallback } from "react";
import { Zap, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { SignalRoute } from "@/stores/route-store";
import type { NodeKind } from "./FlowNodeCard";
import { RouteFlowRow } from "./RouteFlowRow";
import { cn } from "@/lib/utils";

type HealthFilter = "all" | "ok" | "warn" | "error";

interface Props {
  routes: SignalRoute[];
  onNodeClick?: (routeId: string, section: NodeKind) => void;
}

function computeRouteHealth(r: SignalRoute): "ok" | "warn" | "error" {
  const has = (v: string | undefined | null) => !!v && v.trim() !== "";
  const problems: string[] = [];
  if (!has(r.transport.type)) problems.push("transport");
  if (!has(r.encoder.deviceName)) problems.push("encoder");
  if (!has(r.decoder.deviceName)) problems.push("decoder");
  if (!has(r.alias.productionName)) problems.push("alias");
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

export function TransportView({ routes, onNodeClick }: Props) {
  const [healthFilter, setHealthFilter] = useState<HealthFilter>("all");
  const [traceMode, setTraceMode] = useState(false);

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
      {/* Toolbar: health filters + trace toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Health filter chips */}
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

        {/* Trace toggle */}
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
          />
        ))
      )}
    </div>
  );
}
