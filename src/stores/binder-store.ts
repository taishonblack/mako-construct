import { mockBinders } from "@/data/mock-binders";
import type { MockBinder, BinderStatus } from "@/data/mock-binders";

export interface BinderRecord extends MockBinder {
  league: string;
  containerId: string;
  showType: string;
  returnRequired: boolean;
  commercials: string;
  primaryTransport: string;
  backupTransport: string;
  notes: string;
}

export type { BinderStatus };

const STORE_KEY = "mako-binder-records";

function seedFromMock(): BinderRecord[] {
  return mockBinders.map((b) => ({
    ...b,
    league: inferLeague(b.title),
    containerId: "",
    showType: "Standard",
    returnRequired: false,
    commercials: "local-insert",
    primaryTransport: b.transport || "SRT",
    backupTransport: "MPEG-TS",
    notes: "",
  }));
}

export function inferLeague(title: string): string {
  if (title.includes("NBA") || title.includes("WNBA")) return "NBA";
  if (title.includes("NFL")) return "NFL";
  if (title.includes("MLS")) return "MLS";
  if (title.includes("NHL")) return "NHL";
  if (title.includes("College") || title.includes("NCAA")) return "NCAA";
  return "Other";
}

function load(): BinderRecord[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const seeded = seedFromMock();
  save(seeded);
  return seeded;
}

function save(records: BinderRecord[]) {
  localStorage.setItem(STORE_KEY, JSON.stringify(records));
}

// --- Public API (synchronous, localStorage-backed) ---

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
