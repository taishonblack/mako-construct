import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SignalRoute, RoutesState, RouterCrosspoint, RouterConfig } from "./route-types";
import { buildDefaultLinks } from "./route-types";

// Re-export types for convenience
export type { SignalRoute, RoutesState, RouterConfig, RouterCrosspoint, HopNode, RouteLink, RouteHealth, RouteHealthStatus, HopSubtype, NodeMetrics } from "./route-types";
export { HOP_SUBTYPES, CANONICAL_STAGES, buildDefaultLinks } from "./route-types";

// NYR @ BOS seed route definitions
const SEED_ROUTES: Partial<SignalRoute>[] = [
  {
    routeName: "TX 1.1",
    signalSource: { location: "TD Garden — Center Ice", venue: "TD Garden, Boston", signalName: "Center Court Wide" },
    encoder: { brand: "Haivision", model: "Makito X4", deviceName: "ENC-01", inputPort: 1, localIp: "10.0.23.101", notes: "Primary game camera" },
    transport: { type: "SRT Private", srtAddress: "srt://ingest.mako.tv:9001", port: "9001", mode: "caller", passphrase: "nyr-bos-g1-tx1", multicastIp: "", cloudRelayName: "MAKO-East-1" },
    decoder: { brand: "Haivision", model: "Makito X4 RX", deviceName: "DEC-01", outputPort: 1, frameSync: true, localIp: "10.0.26.101" },
    routerMapping: { router: "23", inputCrosspoint: "1", outputCrosspoint: "1", monitorWallDest: "MW-01", evsRecordChannel: "EVS-A1" },
    alias: { engineeringName: "Haivision 1.1", productionName: "ISO-1 Center" },
    health: { status: "healthy", reason: "", lastUpdated: new Date().toISOString() },
  },
  {
    routeName: "TX 2.1",
    signalSource: { location: "TD Garden — Slash Left", venue: "TD Garden, Boston", signalName: "Slash Left" },
    encoder: { brand: "Haivision", model: "Makito X4", deviceName: "ENC-02", inputPort: 1, localIp: "10.0.23.102", notes: "" },
    transport: { type: "SRT Private", srtAddress: "srt://ingest.mako.tv:9002", port: "9002", mode: "caller", passphrase: "nyr-bos-g1-tx2", multicastIp: "", cloudRelayName: "MAKO-East-1" },
    decoder: { brand: "Haivision", model: "Makito X4 RX", deviceName: "DEC-02", outputPort: 2, frameSync: true, localIp: "10.0.26.102" },
    routerMapping: { router: "23", inputCrosspoint: "2", outputCrosspoint: "2", monitorWallDest: "MW-02", evsRecordChannel: "EVS-A2" },
    alias: { engineeringName: "Haivision 2.1", productionName: "ISO-2 Slash L" },
    health: { status: "healthy", reason: "", lastUpdated: new Date().toISOString() },
  },
  {
    routeName: "TX 3.1",
    signalSource: { location: "TD Garden — Slash Right", venue: "TD Garden, Boston", signalName: "Slash Right" },
    encoder: { brand: "Haivision", model: "Makito X4", deviceName: "ENC-03", inputPort: 1, localIp: "10.0.23.103", notes: "" },
    transport: { type: "SRT Private", srtAddress: "srt://ingest.mako.tv:9003", port: "9003", mode: "caller", passphrase: "nyr-bos-g1-tx3", multicastIp: "", cloudRelayName: "MAKO-East-1" },
    decoder: { brand: "Haivision", model: "Makito X4 RX", deviceName: "DEC-03", outputPort: 3, frameSync: false, localIp: "10.0.26.103" },
    routerMapping: { router: "23", inputCrosspoint: "3", outputCrosspoint: "3", monitorWallDest: "MW-03", evsRecordChannel: "EVS-A3" },
    alias: { engineeringName: "Haivision 3.1", productionName: "ISO-3 Slash R" },
    health: { status: "warn", reason: "Elevated packet loss on transport leg", lastUpdated: new Date().toISOString() },
  },
  {
    routeName: "TX 4.1",
    signalSource: { location: "TD Garden — High Home", venue: "TD Garden, Boston", signalName: "High Home" },
    encoder: { brand: "Haivision", model: "Makito X4", deviceName: "ENC-04", inputPort: 1, localIp: "10.0.23.104", notes: "Backup encoder on standby" },
    transport: { type: "SRT Private", srtAddress: "srt://ingest.mako.tv:9004", port: "9004", mode: "caller", passphrase: "nyr-bos-g1-tx4", multicastIp: "", cloudRelayName: "MAKO-East-1" },
    decoder: { brand: "Haivision", model: "Makito X4 RX", deviceName: "DEC-04", outputPort: 4, frameSync: true, localIp: "10.0.26.104" },
    routerMapping: { router: "23", inputCrosspoint: "4", outputCrosspoint: "4", monitorWallDest: "MW-04", evsRecordChannel: "EVS-A4" },
    alias: { engineeringName: "Haivision 4.1", productionName: "ISO-4 High Home" },
    health: { status: "healthy", reason: "", lastUpdated: new Date().toISOString() },
  },
  {
    routeName: "TX 5.1",
    signalSource: { location: "TD Garden — Baseline Left", venue: "TD Garden, Boston", signalName: "Baseline Left" },
    encoder: { brand: "Videon", model: "EdgeCaster", deviceName: "ENC-05", inputPort: 1, localIp: "10.0.23.105", notes: "" },
    transport: { type: "SRT Public", srtAddress: "srt://relay.mako.tv:9005", port: "9005", mode: "caller", passphrase: "nyr-bos-g1-tx5", multicastIp: "", cloudRelayName: "MAKO-East-2" },
    decoder: { brand: "Haivision", model: "Makito X4 RX", deviceName: "DEC-05", outputPort: 5, frameSync: false, localIp: "10.0.26.105" },
    routerMapping: { router: "23", inputCrosspoint: "5", outputCrosspoint: "5", monitorWallDest: "MW-05", evsRecordChannel: "" },
    alias: { engineeringName: "Videon 5.1", productionName: "ISO-5 Baseline L" },
    health: { status: "healthy", reason: "", lastUpdated: new Date().toISOString() },
  },
  {
    routeName: "TX 6.1",
    signalSource: { location: "TD Garden — Handheld 1", venue: "TD Garden, Boston", signalName: "Handheld Left" },
    encoder: { brand: "Videon", model: "EdgeCaster", deviceName: "ENC-06", inputPort: 1, localIp: "10.0.23.106", notes: "" },
    transport: { type: "SRT Public", srtAddress: "srt://relay.mako.tv:9006", port: "9006", mode: "caller", passphrase: "", multicastIp: "", cloudRelayName: "MAKO-East-2" },
    decoder: { brand: "Haivision", model: "Makito X4 RX", deviceName: "DEC-06", outputPort: 6, frameSync: false, localIp: "10.0.26.106" },
    routerMapping: { router: "23", inputCrosspoint: "6", outputCrosspoint: "6", monitorWallDest: "", evsRecordChannel: "" },
    alias: { engineeringName: "Videon 6.1", productionName: "ISO-6 HH1" },
    health: { status: "down", reason: "Encoder offline — no heartbeat since pre-show", lastUpdated: new Date().toISOString() },
  },
];

function createDefaultRoute(index: number): SignalRoute {
  const n = index + 1;
  const pad = (v: number) => String(v).padStart(2, "0");
  const seed = SEED_ROUTES[index];
  if (seed) {
    return {
      id: `route-seed-${n}`,
      routeName: seed.routeName!,
      signalSource: seed.signalSource!,
      audioMapping: [
        { channel: 1, label: "Clean" },
        { channel: 2, label: "Clean" },
        { channel: 3, label: "Nats" },
        { channel: 4, label: "Nats" },
      ],
      encoder: seed.encoder!,
      transport: seed.transport!,
      decoder: seed.decoder!,
      routerMapping: seed.routerMapping!,
      alias: seed.alias!,
      health: seed.health!,
      links: buildDefaultLinks(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    id: `route-${Date.now()}-${n}`,
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

      // Seed defaults if empty
      if (routes.length === 0) {
        routes = Array.from({ length: SEED_ROUTES.length }, (_, i) => createDefaultRoute(i));
        for (const r of routes) {
          const { id, ...routeData } = r;
          await supabase.from("routes").insert({ id, route_name: r.routeName, route_data: routeData as any }).select();
        }
      }
      if (routers.length === 0) {
        routers = [
          { id: "router-cr23", name: "Control Room 23 Router", model: "EQX 32x32", brand: "Evertz", ip: "10.0.23.1", crosspoints: [] },
          { id: "router-cr26", name: "Control Room 26 Router", model: "Ultrix FR5", brand: "Ross", ip: "10.0.26.1", crosspoints: [] },
        ];
        for (const r of routers) {
          await supabase.from("routers").insert({ id: r.id, name: r.name, model: r.model, brand: r.brand, ip: r.ip, crosspoints: r.crosspoints as any }).select();
        }
      }

      setState({ routes, routers });
      setLoading(false);
    }
    load();
  }, []);

  const addRoute = useCallback(async () => {
    const newRoute = createDefaultRoute(state.routes.length);
    setState((prev) => ({ ...prev, routes: [...prev.routes, newRoute] }));
    const { id, ...routeData } = newRoute;
    await supabase.from("routes").insert({ id, route_name: newRoute.routeName, route_data: routeData as any });
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
        if (r.id === "router-cr23") return { ...r, crosspoints: cr23Points };
        if (r.id === "router-cr26") return { ...r, crosspoints: cr26Points };
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
