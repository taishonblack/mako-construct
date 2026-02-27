// ─── Route Types (Canonical NHL Model) ─────────────────────────

// ─── Hop-based relational model ────────────────────────────────

export type HopType = "truck_sdi" | "flypack_patch" | "encoder" | "cloud_transport" | "receiver" | "custom";

export type RouteStatus = "healthy" | "warn" | "down" | "unknown";

export interface RouteHop {
  id: string;
  route_id: string;
  position: number;
  hop_type: HopType;
  label: string;
  meta: Record<string, any>;
  status: RouteStatus;
  created_at: string;
  updated_at: string;
}

export interface CanonicalRoute {
  id: string;
  binder_id: string | null;
  iso_number: number;
  route_name: string;
  status: RouteStatus;
  notes: string;
  hops: RouteHop[];
  created_at: string;
  updated_at: string;
}

// ─── Hop meta shapes (typed) ───────────────────────────────────

export interface TruckSdiMeta {
  sdi_number: number;
  alias: string;
  arena_input: number;
}

export interface FlypackPatchMeta {
  flypack_id: string;
  sdi_port: number;
  label: string;
}

export interface EncoderMeta {
  brand: string;
  unit: number;
  slot: number;
  input_label: string;
  encodes_per_unit: number;
  ip_mode: string;
}

export interface CloudTransportMeta {
  protocol: string;
  mode: string;
  endpoint: string;
  tx_label: string;
}

export interface ReceiverMeta {
  brand: string;
  unit: number | null;
  rx_label: string;
}

// ─── Legacy types (kept for backward compat with existing routes) ───

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

export interface RouteLink {
  from: string;
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
  // New canonical fields
  binder_id?: string | null;
  iso_number?: number;
  notes?: string;
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
  canonicalRoutes: CanonicalRoute[];
}

export const HOP_SUBTYPES: HopSubtype[] = [
  "SDI↔IP", "Fiber", "FrameSync", "Embed/Deembed", "DA", "Scaler", "Other",
];

export const CANONICAL_STAGES = ["source", "encoder", "transport", "cloud", "decoder", "router", "output"] as const;

export const HOP_TYPES: HopType[] = ["truck_sdi", "flypack_patch", "encoder", "cloud_transport", "receiver", "custom"];

export function buildDefaultLinks(): RouteLink[] {
  return [
    { from: "source", to: "encoder", hops: [] },
    { from: "encoder", to: "transport", hops: [] },
    { from: "transport", to: "decoder", hops: [] },
    { from: "decoder", to: "router", hops: [] },
    { from: "router", to: "output", hops: [] },
  ];
}
