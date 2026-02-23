import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────

export interface AudioMapping {
  channel: number;
  label: string; // e.g. "Clean", "Dusty", "DED", "Nats"
}

export interface EncoderDevice {
  brand: string;
  model: string;
  deviceName: string;
  inputPort: number;
  localIp: string;
  notes: string;
}

export interface TransportSpec {
  type: "SRT Public" | "SRT Private" | "MPLS" | "Multicast" | "Fiber" | "";
  srtAddress: string;
  port: string;
  mode: string; // caller / listener / rendezvous
  passphrase: string;
  multicastIp: string;
  cloudRelayName: string;
}

export interface DecoderDevice {
  brand: string;
  model: string;
  deviceName: string;
  outputPort: number;
  frameSync: boolean;
  localIp: string;
}

export interface RouterMapping {
  router: "23" | "26" | "";
  inputCrosspoint: string;
  outputCrosspoint: string;
  monitorWallDest: string;
  evsRecordChannel: string;
}

export interface ProductionAlias {
  engineeringName: string;
  productionName: string;
}

export interface SignalRoute {
  id: string; // immutable
  routeName: string; // editable display name e.g. "TX 1.1"
  signalSource: {
    location: string; // "Arena" | "Truck" | custom
    venue: string;
    signalName: string;
  };
  audioMapping: AudioMapping[];
  encoder: EncoderDevice;
  transport: TransportSpec;
  decoder: DecoderDevice;
  routerMapping: RouterMapping;
  alias: ProductionAlias;
  createdAt: string;
  updatedAt: string;
}

// ─── Router model ────────────────────────────────────────────────

export interface RouterCrosspoint {
  input: number;
  output: number;
  signalLabel: string;
  routeId: string; // links back to SignalRoute
}

export interface RouterConfig {
  id: string;
  name: string; // "Control Room 23 Router"
  model: string;
  brand: string;
  ip: string;
  crosspoints: RouterCrosspoint[];
}

// ─── Store state ─────────────────────────────────────────────────

export interface RoutesState {
  routes: SignalRoute[];
  routers: RouterConfig[];
}

const STORAGE_KEY = "mako-routes";

function createDefaultRoute(index: number): SignalRoute {
  const n = index + 1;
  const pad = (v: number) => String(v).padStart(2, "0");
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildDefaultState(): RoutesState {
  return {
    routes: Array.from({ length: 4 }, (_, i) => createDefaultRoute(i)),
    routers: [
      {
        id: "router-cr23",
        name: "Control Room 23 Router",
        model: "EQX 32x32",
        brand: "Evertz",
        ip: "10.0.23.1",
        crosspoints: [],
      },
      {
        id: "router-cr26",
        name: "Control Room 26 Router",
        model: "Ultrix FR5",
        brand: "Ross",
        ip: "10.0.26.1",
        crosspoints: [],
      },
    ],
  };
}

// ─── Hook ────────────────────────────────────────────────────────

export function useRoutesStore() {
  const [state, setState] = useState<RoutesState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return buildDefaultState();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addRoute = useCallback(() => {
    setState((prev) => ({
      ...prev,
      routes: [...prev.routes, createDefaultRoute(prev.routes.length)],
    }));
  }, []);

  const updateRoute = useCallback((id: string, patch: Partial<SignalRoute>) => {
    setState((prev) => ({
      ...prev,
      routes: prev.routes.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r
      ),
    }));
  }, []);

  const removeRoute = useCallback((id: string) => {
    setState((prev) => ({ ...prev, routes: prev.routes.filter((r) => r.id !== id) }));
  }, []);

  const updateRouter = useCallback((id: string, patch: Partial<RouterConfig>) => {
    setState((prev) => ({
      ...prev,
      routers: prev.routers.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
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
      return {
        ...prev,
        routers: prev.routers.map((r) => {
          if (r.id === "router-cr23") return { ...r, crosspoints: cr23Points };
          if (r.id === "router-cr26") return { ...r, crosspoints: cr26Points };
          return r;
        }),
      };
    });
  }, []);

  return { state, addRoute, updateRoute, removeRoute, updateRouter, syncRouterCrosspoints };
}
