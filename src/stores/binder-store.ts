import { mockBinders } from "@/data/mock-binders";
import type { MockBinder, BinderStatus } from "@/data/mock-binders";

export interface ReturnFeedEndpoint {
  id: string;
  sourcePartner: string;
  type: string;
  host: string;
  port: string;
  mode: string;
  notes: string;
}

export interface DeviceLine {
  id: string;
  brand: string;
  model: string;
  outputsPerUnit: number;
  unitCount: number;
  notes: string;
}

export interface LQPort {
  letter: string;
  label: string;
  notes: string;
}

export interface BinderRecord extends MockBinder {
  league: string;
  containerId: string;
  showType: string;
  returnRequired: boolean;
  commercials: string;
  primaryTransport: string;
  backupTransport: string;
  notes: string;
  eventTime: string;
  timezone: string;
  homeTeam: string;
  awayTeam: string;
  siteType: string;
  studioLocation: string;
  customShowType: string;
  customPrimaryTransport: string;
  customBackupTransport: string;
  customCommercials: string;
  signalNamingMode: string;
  canonicalSignals: string[];
  customSignalNames: string;
  encoderInputsPerUnit: number;
  encoderCount: number;
  decoderOutputsPerUnit: number;
  decoderCount: number;
  autoAllocate: boolean;
  gameType: string;
  season: string;
  // V1 new fields
  controlRoom: string;
  rehearsalDate: string;
  broadcastFeed: string;
  onsiteTechManager: string;
  returnFeedEndpoints: ReturnFeedEndpoint[];
  encoders: DeviceLine[];
  decoders: DeviceLine[];
  outboundHost: string;
  outboundPort: string;
  inboundHost: string;
  inboundPort: string;
  // LQ Ports
  lqRequired: boolean;
  lqPorts: LQPort[];
}

export type { BinderStatus };

const STORE_KEY = "mako-binder-records-v2";

function seedFromMock(): BinderRecord[] {
  return mockBinders.map((b) => ({
    ...b,
    league: "NHL",
    containerId: "",
    showType: "Standard",
    returnRequired: false,
    commercials: "local-insert",
    primaryTransport: b.transport || "SRT",
    backupTransport: "MPEG-TS",
    notes: "",
    eventTime: "19:00",
    timezone: "America/New_York",
    homeTeam: "",
    awayTeam: "",
    siteType: "Arena",
    studioLocation: "",
    customShowType: "",
    customPrimaryTransport: "",
    customBackupTransport: "",
    customCommercials: "",
    signalNamingMode: "iso",
    canonicalSignals: [],
    customSignalNames: "",
    encoderInputsPerUnit: 2,
    encoderCount: 6,
    decoderOutputsPerUnit: 4,
    decoderCount: 6,
    autoAllocate: true,
    gameType: "Regular Season",
    season: "2025–26",
    controlRoom: "23",
    rehearsalDate: "",
    broadcastFeed: "",
    onsiteTechManager: "",
    returnFeedEndpoints: [],
    encoders: [{ id: "enc-1", brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 2, notes: "" }],
    decoders: [{ id: "dec-1", brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 6, notes: "" }],
    outboundHost: "",
    outboundPort: "",
    inboundHost: "",
    inboundPort: "",
    lqRequired: false,
    lqPorts: [
      { letter: "E", label: "Truck AD", notes: "" },
      { letter: "F", label: "Truck Production", notes: "" },
      { letter: "G", label: "Cam Ops", notes: "" },
      { letter: "H", label: "TBD", notes: "" },
    ],
  }));
}

function load(): BinderRecord[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const records: BinderRecord[] = JSON.parse(raw);
      // Backward compat: add new fields with defaults
      return records.map((r) => ({
        ...r,
        controlRoom: r.controlRoom || "23",
        rehearsalDate: r.rehearsalDate || "",
        broadcastFeed: r.broadcastFeed || "",
        onsiteTechManager: r.onsiteTechManager || "",
        returnFeedEndpoints: r.returnFeedEndpoints || [],
        encoders: r.encoders || [{ id: "enc-1", brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 2, notes: "" }],
        decoders: r.decoders || [{ id: "dec-1", brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 6, notes: "" }],
        outboundHost: r.outboundHost || "",
        outboundPort: r.outboundPort || "",
        inboundHost: r.inboundHost || "",
        inboundPort: r.inboundPort || "",
        lqRequired: r.lqRequired ?? false,
        lqPorts: r.lqPorts || [
          { letter: "E", label: "Truck AD", notes: "" },
          { letter: "F", label: "Truck Production", notes: "" },
          { letter: "G", label: "Cam Ops", notes: "" },
          { letter: "H", label: "TBD", notes: "" },
        ],
      }));
    }
  } catch { /* ignore */ }
  const seeded = seedFromMock();
  save(seeded);
  return seeded;
}

function save(records: BinderRecord[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(records));
}

let _cache: BinderRecord[] | null = null;

function getAll(): BinderRecord[] {
  if (!_cache) _cache = load();
  return _cache;
}

function invalidate() { _cache = null; }

export const binderStore = {
  getAll(): BinderRecord[] {
    return getAll();
  },

  getById(id: string): BinderRecord | undefined {
    return getAll().find((b) => b.id === id);
  },

  create(data: Omit<BinderRecord, "id" | "updatedAt">): BinderRecord {
    const all = getAll();
    const id = String(Date.now());
    const record: BinderRecord = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    all.push(record);
    save(all);
    invalidate();
    return record;
  },

  update(id: string, partial: Partial<BinderRecord>): BinderRecord | undefined {
    const all = getAll();
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...partial, updatedAt: new Date().toISOString() };
    save(all);
    invalidate();
    return all[idx];
  },

  delete(id: string): boolean {
    const all = getAll();
    const idx = all.findIndex((b) => b.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    save(all);
    invalidate();
    return true;
  },
};
