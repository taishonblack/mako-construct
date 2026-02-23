import { useState, useEffect, useCallback } from "react";
import type { Signal } from "@/data/mock-signals";
import { generateSignals } from "@/data/mock-signals";
import type { TransportConfig, CommEntry, ChangeEntry, Issue, DocEntry } from "@/data/mock-phase5";
import { mockTransport, mockComms, mockChanges, mockIssues, mockDocs } from "@/data/mock-phase5";
import { mockBinderDetail } from "@/data/mock-binder-detail";

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
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
}

const STORAGE_KEY = "mako-binder-";

function buildInitialState(id: string): BinderState {
  const binder = mockBinderDetail;
  return {
    league: "NBA",
    partner: binder.partner,
    venue: binder.venue,
    showType: "Live Game",
    eventDate: binder.eventDate,
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
  };
}

export function useBinderState(binderId: string) {
  const [state, setState] = useState<BinderState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY + binderId);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    return buildInitialState(binderId);
  });

  // Persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + binderId, JSON.stringify(state));
  }, [state, binderId]);

  // Migration: ensure docs exist for older persisted states
  useEffect(() => {
    if (!state.docs) {
      setState((prev) => ({ ...prev, docs: [...mockDocs] }));
    }
  }, []);

  // Update a top-level field
  const update = useCallback(<K extends keyof BinderState>(key: K, value: BinderState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Change ISO count, preserving edited rows
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

  // Update a single signal field
  const updateSignal = useCallback((iso: number, field: keyof Signal, value: string) => {
    setState((prev) => ({
      ...prev,
      signals: prev.signals.map((s) =>
        s.iso === iso ? { ...s, [field]: value } : s
      ),
    }));
  }, []);

  // Toggle checklist
  const toggleChecklist = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      checklist: prev.checklist.map((c) =>
        c.id === id ? { ...c, checked: !c.checked } : c
      ),
    }));
  }, []);

  // Add a doc/asset
  const addDoc = useCallback((doc: DocEntry) => {
    setState((prev) => ({ ...prev, docs: [...prev.docs, doc] }));
  }, []);

  // Remove a doc/asset
  const removeDoc = useCallback((id: string) => {
    setState((prev) => ({ ...prev, docs: prev.docs.filter((d) => d.id !== id) }));
  }, []);

  // Update a doc/asset field
  const updateDoc = useCallback((id: string, field: keyof DocEntry, value: string) => {
    setState((prev) => ({
      ...prev,
      docs: prev.docs.map((d) =>
        d.id === id ? { ...d, [field]: value } : d
      ),
    }));
  }, []);

  return { state, update, setIsoCount, updateSignal, toggleChecklist, addDoc, removeDoc, updateDoc };
}
