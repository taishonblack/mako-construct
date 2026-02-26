import { useState, useEffect, useCallback } from "react";
import type { Signal } from "@/data/mock-signals";
import { generateSignals, generatePatchpoints } from "@/data/mock-signals";
import type { TransportConfig, CommEntry, ChangeEntry, Issue, DocEntry } from "@/data/mock-phase5";
import { mockTransport, mockComms, mockChanges, mockIssues, mockDocs } from "@/data/mock-phase5";
import { mockBinderDetail } from "@/data/mock-binder-detail";
import type { EventCommandHeaderData, StaffEntry, InternalLQEntry } from "@/components/command/EventCommandHeader";
import { DEFAULT_EVENT_HEADER } from "@/components/command/EventCommandHeader";
import type { AudioPhilosophyData } from "@/components/command/AudioPhilosophy";
import { DEFAULT_AUDIO_PHILOSOPHY } from "@/components/command/AudioPhilosophy";

export type ChecklistStatus = "open" | "in-progress" | "done";

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  assignedTo: string;
  dueAt: string;
  createdAt: string;
  status: ChecklistStatus;
  notes: string;
}

export interface TopologyConfig {
  encoderInputsPerUnit: number;
  encoderCount: number;
  decoderOutputsPerUnit: number;
  decoderCount: number;
  encoderPatchpoints: string[];
  decoderPatchpoints: string[];
}

// --- Lock / Snapshot ---
export interface LockSnapshot {
  id: string;
  lockedAt: string;
  lockedBy: string;
  state: Omit<BinderState, "lockHistory" | "currentLock">;
}

export interface LockState {
  locked: boolean;
  lockedAt: string | null;
  lockedBy: string;
  version: number;
  unlockReason?: string;
}

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

const defaultChecklist: ChecklistItem[] = [
  { id: "ck1", label: "Confirm ISO count with TNT producer", checked: true, assignedTo: "Mike Torres", dueAt: today + "T12:00:00", createdAt: new Date().toISOString(), status: "done", notes: "Confirmed 18 ISOs — Jenna approved" },
  { id: "ck2", label: "Encoder allocation — Makito X4 (6 units)", checked: true, assignedTo: "Sarah Kim", dueAt: today + "T14:00:00", createdAt: new Date().toISOString(), status: "done", notes: "ENC-01 through ENC-06 assigned, all firmware v4.2.1" },
  { id: "ck3", label: "Decoder mapping verified — CR-23", checked: false, assignedTo: "Sarah Kim", dueAt: tomorrow + "T10:00:00", createdAt: new Date().toISOString(), status: "in-progress", notes: "DEC-01 to DEC-04 verified, DEC-05/06 pending fiber patch" },
  { id: "ck4", label: "SRT transport primary test — all 6 paths", checked: false, assignedTo: "Alex Nguyen", dueAt: tomorrow + "T14:00:00", createdAt: new Date().toISOString(), status: "open", notes: "TX 3.1 showing elevated packet loss — investigating" },
  { id: "ck5", label: "Return feed request sent to TNT", checked: false, assignedTo: "Mike Torres", dueAt: today + "T16:00:00", createdAt: new Date().toISOString(), status: "open", notes: "" },
  { id: "ck6", label: "Comms confirmed — PL channels + LQ links", checked: false, assignedTo: "Dave Kowalski", dueAt: tomorrow + "T09:00:00", createdAt: new Date().toISOString(), status: "open", notes: "Need LQ-3 credentials from TNT" },
  { id: "ck7", label: "Graphics package loaded and tested", checked: false, assignedTo: "Marcus Cole", dueAt: tomorrow + "T15:00:00", createdAt: new Date().toISOString(), status: "open", notes: "" },
  { id: "ck8", label: "Venue fiber patch confirmed with TD Garden", checked: false, assignedTo: "Pat Sullivan", dueAt: dayAfter + "T08:00:00", createdAt: new Date().toISOString(), status: "open", notes: "Pat confirmed 12 fiber pairs available" },
  { id: "ck9", label: "Full signal chain test — end-to-end", checked: false, assignedTo: "Sarah Kim", dueAt: dayAfter + "T12:00:00", createdAt: new Date().toISOString(), status: "open", notes: "" },
  { id: "ck10", label: "Release authorization from producer", checked: false, assignedTo: "Mike Torres", dueAt: dayAfter + "T17:00:00", createdAt: new Date().toISOString(), status: "open", notes: "" },
];

export interface BinderState {
  league: string;
  partner: string;
  venue: string;
  showType: string;
  eventDate: string;
  eventTime: string;
  timezone: string;
  homeTeam: string;
  awayTeam: string;
  siteType: string;
  isoCount: number;
  returnRequired: boolean;
  commercials: string;
  signals: Signal[];
  transport: TransportConfig;
  comms: CommEntry[];
  issues: Issue[];
  changes: ChangeEntry[];
  docs: DocEntry[];
  checklist: ChecklistItem[];
  topology: TopologyConfig;
  currentLock: LockState;
  lockHistory: LockSnapshot[];
  eventHeader: EventCommandHeaderData;
  audioPhilosophy: AudioPhilosophyData;
  notes: string;
}

const STORAGE_KEY = "mako-binder-";
const SEED_VERSION_KEY = "mako-binder-seed-v";
const CURRENT_SEED_VERSION = "2"; // Bump to force re-seed with new mock data

function buildDefaultTopology(): TopologyConfig {
  const encCount = 6;
  const encPorts = 2;
  const decCount = 6;
  const decPorts = 4;
  return {
    encoderInputsPerUnit: encPorts,
    encoderCount: encCount,
    decoderOutputsPerUnit: decPorts,
    decoderCount: decCount,
    encoderPatchpoints: generatePatchpoints("encoder", encCount, encPorts),
    decoderPatchpoints: generatePatchpoints("decoder", decCount, decPorts),
  };
}

const DEFAULT_LOCK: LockState = { locked: false, lockedAt: null, lockedBy: "You", version: 0 };

function migrateChecklist(items: any[]): ChecklistItem[] {
  return items.map((item) => ({
    ...item,
    assignedTo: item.assignedTo || "",
    dueAt: item.dueAt || "",
    createdAt: item.createdAt || new Date().toISOString(),
    status: item.status || (item.checked ? "done" : "open"),
    notes: item.notes || "",
  }));
}

function buildInitialState(_id: string): BinderState {
  const binder = mockBinderDetail;
  return {
    league: "NHL",
    partner: binder.partner,
    venue: binder.venue,
    showType: "Live Game",
    eventDate: binder.eventDate,
    eventTime: "19:00",
    timezone: "America/New_York",
    homeTeam: "",
    awayTeam: "",
    siteType: "Arena",
    isoCount: binder.isoCount,
    returnRequired: binder.returnFeed,
    commercials: "local-insert",
    signals: generateSignals(binder.isoCount),
    transport: { ...mockTransport },
    comms: [...mockComms],
    issues: [...mockIssues],
    changes: [...mockChanges],
    docs: [...mockDocs],
    checklist: [...defaultChecklist],
    topology: buildDefaultTopology(),
    currentLock: { ...DEFAULT_LOCK },
    lockHistory: [],
    eventHeader: { ...DEFAULT_EVENT_HEADER },
    audioPhilosophy: { ...DEFAULT_AUDIO_PHILOSOPHY },
    notes: "",
  };
}

export function useBinderState(binderId: string) {
  const [state, setState] = useState<BinderState>(() => {
    // Check seed version — if outdated, clear stale data to get new defaults
    const seedVersion = localStorage.getItem(SEED_VERSION_KEY + binderId);
    if (seedVersion !== CURRENT_SEED_VERSION) {
      localStorage.removeItem(STORAGE_KEY + binderId);
      localStorage.setItem(SEED_VERSION_KEY + binderId, CURRENT_SEED_VERSION);
    }

    const stored = localStorage.getItem(STORAGE_KEY + binderId);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed.topology) parsed.topology = buildDefaultTopology();
        if (!parsed.eventTime) parsed.eventTime = "19:00";
        if (!parsed.timezone) parsed.timezone = "America/New_York";
        if (!parsed.homeTeam) parsed.homeTeam = "";
        if (!parsed.awayTeam) parsed.awayTeam = "";
        if (!parsed.siteType) parsed.siteType = "Arena";
        if (!parsed.currentLock) parsed.currentLock = { ...DEFAULT_LOCK };
        if (!parsed.lockHistory) parsed.lockHistory = [];
        if (!parsed.eventHeader) parsed.eventHeader = { ...DEFAULT_EVENT_HEADER };
        if (!parsed.audioPhilosophy) parsed.audioPhilosophy = { ...DEFAULT_AUDIO_PHILOSOPHY };
        if (parsed.notes === undefined) parsed.notes = "";
        if (parsed.checklist) {
          parsed.checklist = migrateChecklist(parsed.checklist);
        }
        if (parsed.signals) {
          parsed.signals = parsed.signals.map((s: Signal) => ({
            ...s,
            txName: s.txName || "",
            rxName: s.rxName || "",
            linkedRouteId: (s as any).linkedRouteId || "",
          }));
        }
        return parsed;
      } catch { /* ignore */ }
    }
    return buildInitialState(binderId);
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + binderId, JSON.stringify(state));
  }, [state, binderId]);

  useEffect(() => {
    if (!state.docs) {
      setState((prev) => ({ ...prev, docs: [...mockDocs] }));
    }
  }, []);

  const update = useCallback(<K extends keyof BinderState>(key: K, value: BinderState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setIsoCount = useCallback((count: number) => {
    setState((prev) => {
      const clamped = Math.max(1, Math.min(28, count));
      const existing = prev.signals;
      const newSignals: Signal[] = [];
      for (let i = 0; i < clamped; i++) {
        if (i < existing.length) {
          newSignals.push({ ...existing[i], iso: i + 1 });
        } else {
          const generated = generateSignals(i + 1);
          newSignals.push(generated[i]);
        }
      }
      return { ...prev, isoCount: clamped, signals: newSignals };
    });
  }, []);

  const updateSignal = useCallback((iso: number, field: keyof Signal, value: string) => {
    setState((prev) => ({
      ...prev,
      signals: prev.signals.map((s) =>
        s.iso === iso ? { ...s, [field]: value } : s
      ),
    }));
  }, []);

  const updateSignals = useCallback((updater: (signals: Signal[]) => Signal[]) => {
    setState((prev) => ({ ...prev, signals: updater(prev.signals) }));
  }, []);

  const updateTopology = useCallback((topology: TopologyConfig) => {
    setState((prev) => ({ ...prev, topology }));
  }, []);

  const toggleChecklist = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      checklist: prev.checklist.map((c) =>
        c.id === id ? { ...c, checked: !c.checked, status: !c.checked ? "done" : "open" } : c
      ),
    }));
  }, []);

  // Enhanced checklist operations
  const addChecklistItem = useCallback((item: Omit<ChecklistItem, "id" | "createdAt">) => {
    setState((prev) => ({
      ...prev,
      checklist: [...prev.checklist, {
        ...item,
        id: `ck-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }],
    }));
  }, []);

  const updateChecklistItem = useCallback((id: string, patch: Partial<ChecklistItem>) => {
    setState((prev) => ({
      ...prev,
      checklist: prev.checklist.map((c) =>
        c.id === id ? { ...c, ...patch, checked: patch.status === "done" ? true : patch.status === "open" ? false : c.checked } : c
      ),
    }));
  }, []);

  const removeChecklistItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((c) => c.id !== id),
    }));
  }, []);

  const addDoc = useCallback((doc: DocEntry) => {
    setState((prev) => ({ ...prev, docs: [...prev.docs, doc] }));
  }, []);

  const removeDoc = useCallback((id: string) => {
    setState((prev) => ({ ...prev, docs: prev.docs.filter((d) => d.id !== id) }));
  }, []);

  const updateComm = useCallback((id: string, field: keyof CommEntry, value: string) => {
    setState((prev) => ({
      ...prev,
      comms: prev.comms.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  }, []);

  const addComm = useCallback((type: CommEntry["type"]) => {
    const prefix = type === "Clear-Com" ? "PL" : type === "LQ" ? "LQ" : "HM";
    const existing = state.comms.filter(c => c.type === type);
    const nextNum = existing.length + 1;
    const newComm: CommEntry = {
      id: `cm-${Date.now()}`,
      type,
      channel: `${prefix}-${nextNum}`,
      assignment: "",
      location: type === "Hot Mic" ? "Arena" : type === "LQ" ? "Transmission" : "Truck",
    };
    setState((prev) => ({ ...prev, comms: [...prev.comms, newComm] }));
  }, [state.comms]);

  const removeComm = useCallback((id: string) => {
    setState((prev) => ({ ...prev, comms: prev.comms.filter((c) => c.id !== id) }));
  }, []);

  const updateDoc = useCallback((id: string, field: keyof DocEntry, value: string) => {
    setState((prev) => ({
      ...prev,
      docs: prev.docs.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  }, []);

  // Audio Philosophy
  const updateAudioPhilosophy = useCallback((audio: AudioPhilosophyData) => {
    setState((prev) => {
      const changes: ChangeEntry[] = [];
      const old = prev.audioPhilosophy;
      const now = new Date().toISOString();
      const fields: { key: keyof AudioPhilosophyData; label: string }[] = [
        { key: "outputMode", label: "Audio Output Mode" },
        { key: "natsSource", label: "Nats Source" },
        { key: "announcerRouting", label: "Announcer Routing" },
        { key: "notes", label: "Audio Notes" },
      ];
      for (const f of fields) {
        const oldVal = String(old[f.key] ?? "");
        const newVal = String(audio[f.key] ?? "");
        if (oldVal !== newVal && (oldVal || newVal)) {
          changes.push({
            id: `ch-ap-${Date.now()}-${f.key}`,
            label: `${f.label}: ${oldVal || "(empty)"} → ${newVal || "(empty)"}`,
            timestamp: now,
            status: "confirmed",
            author: "System",
          });
        }
      }
      return {
        ...prev,
        audioPhilosophy: audio,
        changes: changes.length > 0 ? [...changes, ...prev.changes] : prev.changes,
      };
    });
  }, []);

  // Event Header
  const updateEventHeader = useCallback((header: EventCommandHeaderData) => {
    setState((prev) => {
      const changes: ChangeEntry[] = [];
      const old = prev.eventHeader;
      const now = new Date().toISOString();
      const fields: { key: keyof EventCommandHeaderData; label: string }[] = [
        { key: "projectTitle", label: "Project Title" },
        { key: "showDate", label: "Show Date" },
        { key: "showTime", label: "Show Time" },
        { key: "rehearsalDate", label: "Rehearsal Date" },
        { key: "nhlGame", label: "NHL Game" },
        { key: "arena", label: "Arena" },
        { key: "broadcastFeed", label: "Broadcast Feed" },
        { key: "controlRoom", label: "Control Room" },
        { key: "onsiteTechManager", label: "Onsite Tech Manager" },
        { key: "notes", label: "Event Notes" },
        { key: "txFormat", label: "TX Format" },
        { key: "rxFormat", label: "RX Format" },
      ];
      for (const f of fields) {
        const oldVal = String(old[f.key] ?? "");
        const newVal = String(header[f.key] ?? "");
        if (oldVal !== newVal && (oldVal || newVal)) {
          changes.push({
            id: `ch-eh-${Date.now()}-${f.key}`,
            label: `${f.label}: ${oldVal || "(empty)"} → ${newVal || "(empty)"}`,
            timestamp: now,
            status: "confirmed",
            author: "System",
          });
        }
      }
      return {
        ...prev,
        eventHeader: header,
        changes: changes.length > 0 ? [...changes, ...prev.changes] : prev.changes,
      };
    });
  }, []);

  // Generate TX/RX names
  const generateTxRx = useCallback(() => {
    setState((prev) => {
      const cr = prev.eventHeader.controlRoom;
      const newSignals = prev.signals.map((s) => {
        const encNum = s.encoderInput ? s.encoderInput.split("-")[1]?.split(":")[0]?.replace(/^0+/, "") || String(s.iso) : String(s.iso);
        const inNum = s.encoderInput ? s.encoderInput.split(":")[1] || String(s.iso % 2 === 0 ? 2 : 1) : String(s.iso % 2 === 0 ? 2 : 1);
        const decNum = s.decoderOutput ? s.decoderOutput.replace(/[^0-9]/g, "") : String(s.iso).padStart(2, "0");
        const txName = s.txName || `TX-ENC${encNum.padStart(2, "0")}-IN${String(inNum).replace(/[^0-9]/g, "").padStart(2, "0")}`;
        const rxName = s.rxName || `RX-CR${cr}-DEC${decNum.padStart(2, "0")}-OUT${String(s.iso).padStart(2, "0")}`;
        return { ...s, txName, rxName };
      });
      const changeEntry: ChangeEntry = {
        id: `ch-txrx-${Date.now()}`,
        label: `TX/RX names auto-generated for ${newSignals.filter((s, i) => s.txName !== prev.signals[i]?.txName || s.rxName !== prev.signals[i]?.rxName).length} signals`,
        timestamp: new Date().toISOString(),
        status: "confirmed",
        author: "System",
      };
      return { ...prev, signals: newSignals, changes: [changeEntry, ...prev.changes] };
    });
  }, []);

  // Lock operations
  const lockBinder = useCallback(() => {
    setState((prev) => {
      const newVersion = prev.currentLock.version + 1;
      const now = new Date().toISOString();
      const { currentLock, lockHistory, ...snapshotState } = prev;
      const snapshot: LockSnapshot = {
        id: `lock-v${newVersion}`,
        lockedAt: now,
        lockedBy: "You",
        state: snapshotState,
      };
      const lockChange: ChangeEntry = {
        id: `ch-lock-${Date.now()}`,
        label: `Production locked — Lock v${newVersion}`,
        timestamp: now,
        status: "confirmed",
        author: "System",
      };
      return {
        ...prev,
        currentLock: { locked: true, lockedAt: now, lockedBy: "You", version: newVersion },
        lockHistory: [snapshot, ...prev.lockHistory],
        changes: [lockChange, ...prev.changes],
      };
    });
  }, []);

  const unlockBinder = useCallback((reason: string) => {
    setState((prev) => {
      const now = new Date().toISOString();
      const unlockChange: ChangeEntry = {
        id: `ch-unlock-${Date.now()}`,
        label: `Production unlocked — Reason: ${reason}`,
        timestamp: now,
        status: "confirmed",
        author: "System",
      };
      return {
        ...prev,
        currentLock: { ...prev.currentLock, locked: false, unlockReason: reason },
        changes: [unlockChange, ...prev.changes],
      };
    });
  }, []);

  // Auto-sync linked route data
  const syncSignalsFromRoutes = useCallback((routes: import("@/stores/route-store").SignalRoute[]) => {
    setState((prev) => {
      const routeMap = new Map(routes.map((r) => [r.id, r]));
      let changed = false;
      const newSignals = prev.signals.map((s) => {
        if (!s.linkedRouteId) return s;
        const route = routeMap.get(s.linkedRouteId);
        if (!route) return s;

        const updates: Partial<Signal> = {};
        if (route.alias.productionName && route.alias.productionName !== s.productionAlias) {
          updates.productionAlias = route.alias.productionName;
        }
        if (route.transport.type && route.transport.type !== s.transport) {
          updates.transport = route.transport.type;
        }
        if (route.routeName && route.routeName !== s.txName) {
          updates.txName = route.routeName;
        }
        if (route.alias.engineeringName && route.alias.engineeringName !== s.rxName) {
          updates.rxName = route.alias.engineeringName;
        }
        if (route.encoder.deviceName && route.encoder.deviceName !== s.encoderInput) {
          updates.encoderInput = route.encoder.deviceName;
        }
        if (route.decoder.deviceName && route.decoder.deviceName !== s.decoderOutput) {
          updates.decoderOutput = route.decoder.deviceName;
        }

        if (Object.keys(updates).length > 0) {
          changed = true;
          return { ...s, ...updates };
        }
        return s;
      });

      if (!changed) return prev;
      return { ...prev, signals: newSignals };
    });
  }, []);

  return {
    state, update, setIsoCount, updateSignal, updateSignals, updateTopology,
    toggleChecklist, addDoc, removeDoc, updateDoc,
    updateComm, addComm, removeComm,
    lockBinder, unlockBinder,
    updateEventHeader, generateTxRx,
    updateAudioPhilosophy,
    syncSignalsFromRoutes,
    addChecklistItem, updateChecklistItem, removeChecklistItem,
  };
}
