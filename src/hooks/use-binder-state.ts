import { useState, useEffect, useCallback } from "react";
import type { Signal } from "@/data/mock-signals";
import { generateSignals, generatePatchpoints } from "@/data/mock-signals";
import type { TransportConfig, CommEntry, ChangeEntry, Issue, DocEntry } from "@/data/mock-phase5";
import { mockTransport, mockComms, mockChanges, mockIssues, mockDocs } from "@/data/mock-phase5";
import { mockBinderDetail } from "@/data/mock-binder-detail";

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
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

const defaultChecklist: ChecklistItem[] = [
  { id: "ck1", label: "Fax Completed", checked: false },
  { id: "ck2", label: "Validation Complete", checked: false },
  { id: "ck3", label: "Transmission Tested", checked: false },
  { id: "ck4", label: "Return Confirmed", checked: false },
  { id: "ck5", label: "Encoder Allocation Verified", checked: false },
  { id: "ck6", label: "Decoder Mapping Verified", checked: false },
  { id: "ck7", label: "Commercial Handling Confirmed", checked: false },
  { id: "ck8", label: "Release Confirmed", checked: false },
];

export interface BinderState {
  // Production Definition
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
  // Signals
  signals: Signal[];
  // Transport
  transport: TransportConfig;
  // Comms
  comms: CommEntry[];
  // Issues & Changes
  issues: Issue[];
  changes: ChangeEntry[];
  // Documents / Assets
  docs: DocEntry[];
  // Checklist
  checklist: ChecklistItem[];
  // Topology
  topology: TopologyConfig;
  // Lock
  currentLock: LockState;
  lockHistory: LockSnapshot[];
}

const STORAGE_KEY = "mako-binder-";

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
  };
}

export function useBinderState(binderId: string) {
  const [state, setState] = useState<BinderState>(() => {
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
        c.id === id ? { ...c, checked: !c.checked } : c
      ),
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

  // --- Lock operations ---
  const lockBinder = useCallback(() => {
    setState((prev) => {
      const newVersion = prev.currentLock.version + 1;
      const now = new Date().toISOString();
      // Create snapshot of current state (exclude lock metadata)
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

  return {
    state, update, setIsoCount, updateSignal, updateSignals, updateTopology,
    toggleChecklist, addDoc, removeDoc, updateDoc,
    updateComm, addComm, removeComm,
    lockBinder, unlockBinder,
  };
}
