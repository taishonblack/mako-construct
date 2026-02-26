import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SignalRoute, RoutesState, RouterCrosspoint, RouterConfig } from "./route-types";
import { buildDefaultLinks } from "./route-types";

// Re-export types for convenience
export type { SignalRoute, RoutesState, RouterConfig, RouterCrosspoint, HopNode, RouteLink, RouteHealth, RouteHealthStatus, HopSubtype, NodeMetrics } from "./route-types";
export { HOP_SUBTYPES, CANONICAL_STAGES, buildDefaultLinks } from "./route-types";


function createDefaultRoute(index: number, id?: string): SignalRoute {
  const n = index + 1;
  const pad = (v: number) => String(v).padStart(2, "0");
  return {
    id: id || crypto.randomUUID(),
    routeName: `TX ${n}.1`,
    signalSource: { location: "Truck", venue: "", signalName: `Camera ${n}` },
    audioMapping: [
      { channel: 1, label: "Clean" },
      { channel: 2, label: "Clean" },
      { channel: 3, label: "Nats" },
      { channel: 4, label: "Nats" },
    ],
    encoder: { brand: "Videon", model: "", deviceName: `ENC-${pad(n)}`, inputPort: 1, localIp: "", notes: "" },
    transport: { type: "SRT Public", srtAddress: "", port: "", mode: "caller", passphrase: "", multicastIp: "", cloudRelayName: "" },
    decoder: { brand: "Haivision", model: "", deviceName: `DEC-${pad(n)}`, outputPort: 1, frameSync: false, localIp: "" },
    routerMapping: { router: "26", inputCrosspoint: String(n), outputCrosspoint: String(n), monitorWallDest: "", evsRecordChannel: "" },
    alias: { engineeringName: `Haivision ${n}.1`, productionName: `ISO ${n}` },
    health: { status: "healthy", reason: "", lastUpdated: new Date().toISOString() },
    links: buildDefaultLinks(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function migrateRoute(r: any): SignalRoute {
  return {
    ...r,
    health: r.health ?? { status: "healthy", reason: "", lastUpdated: new Date().toISOString() },
    links: (r.links ?? buildDefaultLinks()).map((l: any) => ({
      ...l,
      hops: (l.hops || []).map((h: any) => ({ ...h, enabled: h.enabled ?? true })),
    })),
  };
}

export function useRoutesStore() {
  const [state, setState] = useState<RoutesState>({ routes: [], routers: [] });
  const [loading, setLoading] = useState(true);

  // Load from Cloud on mount
  useEffect(() => {
    async function load() {
      const [routesRes, routersRes] = await Promise.all([
        supabase.from("routes").select("*").order("created_at"),
        supabase.from("routers").select("*").order("name"),
      ]);

      let routes: SignalRoute[] = (routesRes.data || []).map((row: any) => migrateRoute({ id: row.id, ...row.route_data }));
      let routers: RouterConfig[] = (routersRes.data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        model: row.model,
        brand: row.brand,
        ip: row.ip,
        crosspoints: row.crosspoints || [],
      }));


      setState({ routes, routers });
      setLoading(false);
    }
    load();
  }, []);

  const addRoute = useCallback(async () => {
    const newRoute = createDefaultRoute(state.routes.length);
    const { id: _id, ...routeData } = newRoute;
    const { data } = await supabase.from("routes").insert({ route_name: newRoute.routeName, route_data: routeData as any }).select().single();
    const finalRoute = data ? migrateRoute({ id: data.id, ...routeData }) : newRoute;
    setState((prev) => ({ ...prev, routes: [...prev.routes, finalRoute] }));
  }, [state.routes.length]);

  const updateRoute = useCallback(async (id: string, patch: Partial<SignalRoute>) => {
    setState((prev) => {
      const updated = prev.routes.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
      );
      // Persist async
      const full = updated.find((r) => r.id === id);
      if (full) {
        const { id: _id, ...routeData } = full;
        supabase.from("routes").update({ route_name: full.routeName, route_data: routeData as any }).eq("id", id).then();
      }
      return { ...prev, routes: updated };
    });
  }, []);

  const removeRoute = useCallback(async (id: string) => {
    setState((prev) => ({ ...prev, routes: prev.routes.filter((r) => r.id !== id) }));
    await supabase.from("routes").delete().eq("id", id);
  }, []);

  const updateRouter = useCallback(async (id: string, patch: Partial<RouterConfig>) => {
    setState((prev) => ({
      ...prev,
      routers: prev.routers.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    const { crosspoints, ...rest } = patch as any;
    const dbPatch: any = { ...rest };
    if (crosspoints !== undefined) dbPatch.crosspoints = crosspoints;
    await supabase.from("routers").update(dbPatch).eq("id", id);
  }, []);

  const syncRouterCrosspoints = useCallback(() => {
    setState((prev) => {
      const cr23Points: RouterCrosspoint[] = [];
      const cr26Points: RouterCrosspoint[] = [];
      for (const route of prev.routes) {
        const point: RouterCrosspoint = {
          input: parseInt(route.routerMapping.inputCrosspoint) || 0,
          output: parseInt(route.routerMapping.outputCrosspoint) || 0,
          signalLabel: route.alias.productionName || route.routeName,
          routeId: route.id,
        };
        if (route.routerMapping.router === "23") cr23Points.push(point);
        else if (route.routerMapping.router === "26") cr26Points.push(point);
      }
      const newRouters = prev.routers.map((r) => {
        if (r.name.includes("23")) return { ...r, crosspoints: cr23Points };
        if (r.name.includes("26")) return { ...r, crosspoints: cr26Points };
        return r;
      });
      // Persist
      for (const r of newRouters) {
        supabase.from("routers").update({ crosspoints: r.crosspoints as any }).eq("id", r.id).then();
      }
      return { ...prev, routers: newRouters };
    });
  }, []);

  return { state, loading, addRoute, updateRoute, removeRoute, updateRouter, syncRouterCrosspoints };
}
