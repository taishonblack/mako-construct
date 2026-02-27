import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type {
  SignalRoute, RoutesState, RouterCrosspoint, RouterConfig,
  CanonicalRoute, RouteHop, RouteStatus, HopType,
} from "./route-types";
import { buildDefaultLinks } from "./route-types";

// Re-export types for convenience
export type {
  SignalRoute, RoutesState, RouterConfig, RouterCrosspoint,
  HopNode, RouteLink, RouteHealth, RouteHealthStatus, HopSubtype, NodeMetrics,
  CanonicalRoute, RouteHop, RouteStatus,
} from "./route-types";
export { HOP_SUBTYPES, CANONICAL_STAGES, buildDefaultLinks, HOP_TYPES } from "./route-types";


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
  const [state, setState] = useState<RoutesState>({ routes: [], routers: [], canonicalRoutes: [] });
  const [loading, setLoading] = useState(true);

  // Load from Cloud on mount
  useEffect(() => {
    async function load() {
      const [routesRes, routersRes, hopsRes] = await Promise.all([
        supabase.from("routes").select("*").order("created_at"),
        supabase.from("routers").select("*").order("name"),
        supabase.from("route_hops").select("*").order("position"),
      ]);

      // Build legacy routes from route_data
      const legacyRoutes: SignalRoute[] = [];
      const canonicalRoutes: CanonicalRoute[] = [];
      const hopsMap = new Map<string, RouteHop[]>();

      // Group hops by route_id
      for (const h of (hopsRes.data || [])) {
        const routeId = h.route_id;
        if (!hopsMap.has(routeId)) hopsMap.set(routeId, []);
        hopsMap.get(routeId)!.push({
          id: h.id,
          route_id: h.route_id,
          position: h.position,
          hop_type: h.hop_type as HopType,
          label: h.label,
          meta: h.meta as Record<string, any>,
          status: h.status as RouteStatus,
          created_at: h.created_at,
          updated_at: h.updated_at,
        });
      }

      for (const row of (routesRes.data || [])) {
        const hasRouteData = row.route_data && Object.keys(row.route_data as any).length > 0;
        const routeHops = hopsMap.get(row.id) || [];
        const isCanonical = routeHops.length > 0;

        if (isCanonical) {
          canonicalRoutes.push({
            id: row.id,
            binder_id: (row as any).binder_id || null,
            iso_number: (row as any).iso_number || 0,
            route_name: row.route_name,
            status: ((row as any).status || "unknown") as RouteStatus,
            notes: (row as any).notes || "",
            hops: routeHops.sort((a, b) => a.position - b.position),
            created_at: row.created_at,
            updated_at: row.updated_at,
          });
        }

        if (hasRouteData) {
          legacyRoutes.push(migrateRoute({ id: row.id, ...row.route_data as any }));
        }
      }

      const routers: RouterConfig[] = (routersRes.data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        model: row.model,
        brand: row.brand,
        ip: row.ip,
        crosspoints: row.crosspoints || [],
      }));

      setState({ routes: legacyRoutes, routers, canonicalRoutes });
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
      const full = updated.find((r) => r.id === id);
      if (full) {
        const { id: _id, ...routeData } = full;
        supabase.from("routes").update({ route_name: full.routeName, route_data: routeData as any }).eq("id", id).then();
      }
      return { ...prev, routes: updated };
    });
  }, []);

  const removeRoute = useCallback(async (id: string) => {
    setState((prev) => ({
      ...prev,
      routes: prev.routes.filter((r) => r.id !== id),
      canonicalRoutes: prev.canonicalRoutes.filter((r) => r.id !== id),
    }));
    await supabase.from("routes").delete().eq("id", id);
  }, []);

  // ─── Canonical route operations ────────────────────────────

  const updateCanonicalRoute = useCallback(async (id: string, patch: Partial<Pick<CanonicalRoute, "status" | "notes" | "route_name">>) => {
    setState((prev) => ({
      ...prev,
      canonicalRoutes: prev.canonicalRoutes.map((r) =>
        r.id === id ? { ...r, ...patch, updated_at: new Date().toISOString() } : r
      ),
    }));
    const dbPatch: any = {};
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes;
    if (patch.route_name !== undefined) dbPatch.route_name = patch.route_name;
    await supabase.from("routes").update(dbPatch).eq("id", id);
  }, []);

  const updateHop = useCallback(async (hopId: string, patch: Partial<Pick<RouteHop, "label" | "meta" | "status">>) => {
    setState((prev) => ({
      ...prev,
      canonicalRoutes: prev.canonicalRoutes.map((r) => ({
        ...r,
        hops: r.hops.map((h) => h.id === hopId ? { ...h, ...patch } : h),
      })),
    }));
    const dbPatch: any = {};
    if (patch.label !== undefined) dbPatch.label = patch.label;
    if (patch.meta !== undefined) dbPatch.meta = patch.meta;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    await supabase.from("route_hops").update(dbPatch).eq("id", hopId);
  }, []);

  const addCanonicalHop = useCallback(async (routeId: string, afterPosition: number, hopType: string, label: string, meta: Record<string, any> = {}) => {
    // Shift positions of existing hops
    const route = state.canonicalRoutes.find(r => r.id === routeId);
    if (!route) return;

    const newPosition = afterPosition + 1;

    // Shift subsequent hops
    for (const hop of route.hops.filter(h => h.position >= newPosition)) {
      await supabase.from("route_hops").update({ position: hop.position + 1 }).eq("id", hop.id);
    }

    const { data } = await supabase.from("route_hops").insert({
      route_id: routeId,
      position: newPosition,
      hop_type: hopType,
      label,
      meta: meta as any,
      status: "unknown",
    }).select().single();

    if (data) {
      setState((prev) => ({
        ...prev,
        canonicalRoutes: prev.canonicalRoutes.map((r) => {
          if (r.id !== routeId) return r;
          const hops = r.hops.map(h => h.position >= newPosition ? { ...h, position: h.position + 1 } : h);
          hops.push({
            id: data.id,
            route_id: routeId,
            position: newPosition,
            hop_type: data.hop_type as HopType,
            label: data.label,
            meta: data.meta as Record<string, any>,
            status: data.status as RouteStatus,
            created_at: data.created_at,
            updated_at: data.updated_at,
          });
          hops.sort((a, b) => a.position - b.position);
          return { ...r, hops };
        }),
      }));
    }
  }, [state.canonicalRoutes]);

  const removeHop = useCallback(async (hopId: string) => {
    setState((prev) => ({
      ...prev,
      canonicalRoutes: prev.canonicalRoutes.map((r) => ({
        ...r,
        hops: r.hops.filter(h => h.id !== hopId),
      })),
    }));
    await supabase.from("route_hops").delete().eq("id", hopId);
  }, []);

  const refreshCanonicalRoutes = useCallback(async (binderId?: string) => {
    let query = supabase.from("routes").select("*").order("created_at");
    if (binderId) query = query.eq("binder_id", binderId);

    const [routesRes, hopsRes] = await Promise.all([
      query,
      supabase.from("route_hops").select("*").order("position"),
    ]);

    const hopsMap = new Map<string, RouteHop[]>();
    for (const h of (hopsRes.data || [])) {
      if (!hopsMap.has(h.route_id)) hopsMap.set(h.route_id, []);
      hopsMap.get(h.route_id)!.push({
        id: h.id, route_id: h.route_id, position: h.position,
        hop_type: h.hop_type as HopType, label: h.label, meta: h.meta as any,
        status: h.status as RouteStatus, created_at: h.created_at, updated_at: h.updated_at,
      });
    }

    const canonicalRoutes: CanonicalRoute[] = [];
    for (const row of (routesRes.data || [])) {
      const hops = hopsMap.get(row.id) || [];
      if (hops.length > 0) {
        canonicalRoutes.push({
          id: row.id,
          binder_id: (row as any).binder_id || null,
          iso_number: (row as any).iso_number || 0,
          route_name: row.route_name,
          status: ((row as any).status || "unknown") as RouteStatus,
          notes: (row as any).notes || "",
          hops: hops.sort((a, b) => a.position - b.position),
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
      }
    }

    setState((prev) => ({ ...prev, canonicalRoutes }));
  }, []);

  // ─── Legacy router operations ──────────────────────────────

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
      for (const r of newRouters) {
        supabase.from("routers").update({ crosspoints: r.crosspoints as any }).eq("id", r.id).then();
      }
      return { ...prev, routers: newRouters };
    });
  }, []);

  return {
    state, loading,
    // Legacy
    addRoute, updateRoute, removeRoute, updateRouter, syncRouterCrosspoints,
    // Canonical
    updateCanonicalRoute, updateHop, addCanonicalHop, removeHop, refreshCanonicalRoutes,
  };
}
