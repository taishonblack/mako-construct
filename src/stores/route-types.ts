// ─── Route Types ───────────────────────────────────────────────

export interface AudioMapping {
  channel: number;
  label: string;
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
  mode: string;
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

export type HopSubtype = "SDI↔IP" | "Fiber" | "FrameSync" | "Embed/Deembed" | "DA" | "Scaler" | "Other";

export interface NodeMetrics {
  latencyMs: number;
  packetLossPct: number;
  bitrateKbps: number;
}

export interface HopNode {
  id: string;
  subtype: HopSubtype;
  label: string;
  vendor: string;
  model: string;
  notes: string;
  status: "ok" | "warn" | "error" | "offline" | "unknown";
  enabled: boolean;
  metrics?: NodeMetrics;
}

export type RouteHealthStatus = "healthy" | "warn" | "down";

export interface RouteHealth {
  status: RouteHealthStatus;
  reason: string;
  lastUpdated: string;
}

/** Represents hops between two canonical stages */
export interface RouteLink {
  from: string; // stage id: "source" | "encoder" | "transport" | "cloud" | "decoder" | "router"
  to: string;
  hops: HopNode[];
}

export interface SignalRoute {
  id: string;
  routeName: string;
  signalSource: {
    location: string;
    venue: string;
    signalName: string;
  };
  audioMapping: AudioMapping[];
  encoder: EncoderDevice;
  transport: TransportSpec;
  decoder: DecoderDevice;
  routerMapping: RouterMapping;
  alias: ProductionAlias;
  health: RouteHealth;
  links: RouteLink[];
  createdAt: string;
  updatedAt: string;
}

// ─── Router model ────────────────────────────────────────────────

export interface RouterCrosspoint {
  input: number;
  output: number;
  signalLabel: string;
  routeId: string;
}

export interface RouterConfig {
  id: string;
  name: string;
  model: string;
  brand: string;
  ip: string;
  crosspoints: RouterCrosspoint[];
}

export interface RoutesState {
  routes: SignalRoute[];
  routers: RouterConfig[];
}

export const HOP_SUBTYPES: HopSubtype[] = [
  "SDI↔IP", "Fiber", "FrameSync", "Embed/Deembed", "DA", "Scaler", "Other",
];

export const CANONICAL_STAGES = ["source", "encoder", "transport", "cloud", "decoder", "router", "output"] as const;

/** Build default empty links between canonical stages */
export function buildDefaultLinks(): RouteLink[] {
  return [
    { from: "source", to: "encoder", hops: [] },
    { from: "encoder", to: "transport", hops: [] },
    { from: "transport", to: "decoder", hops: [] },
    { from: "decoder", to: "router", hops: [] },
    { from: "router", to: "output", hops: [] },
  ];
}
