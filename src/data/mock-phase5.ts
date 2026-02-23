export interface TransportConfig {
  primary: { protocol: string; destination: string; port: number; latency: string; encryption: boolean };
  backup: { protocol: string; destination: string; port: number; latency: string; encryption: boolean };
  returnFeed: boolean;
  commercials: "local-insert" | "pass-through" | "none";
  notes: string;
}

export interface CommEntry {
  id: string;
  type: "Clear-Com" | "LQ" | "Hot Mic";
  channel: string;
  assignment: string;
  location: string;
}

export interface ChangeEntry {
  id: string;
  label: string;
  timestamp: string;
  status: "proposed" | "confirmed" | "rejected";
  author: string;
}

export interface Issue {
  id: string;
  title: string;
  status: "open" | "resolved" | "escalated";
  priority: "low" | "medium" | "high";
  assignee: string;
  createdAt: string;
}

export interface DocEntry {
  id: string;
  type: "Primer" | "Call Sheet" | "Schedule" | "Diagram" | "Rundown";
  name: string;
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  extractionStatus: "complete" | "pending" | "failed";
  url?: string;
}

export const mockTransport: TransportConfig = {
  primary: { protocol: "SRT", destination: "espn-ingest-east.srt.live", port: 9000, latency: "120ms", encryption: true },
  backup: { protocol: "MPEG-TS", destination: "espn-backup.ts.live", port: 5000, latency: "200ms", encryption: false },
  returnFeed: true,
  commercials: "local-insert",
  notes: "Primary path confirmed with ESPN transmission. Backup path on standby — activate only on primary failure. Return feed carries program mix + comms.",
};

export const mockComms: CommEntry[] = [
  { id: "cm1", type: "Clear-Com", channel: "PL-1", assignment: "Director / TD", location: "Truck" },
  { id: "cm2", type: "Clear-Com", channel: "PL-2", assignment: "Producer / Graphics", location: "Studio" },
  { id: "cm3", type: "Clear-Com", channel: "PL-3", assignment: "Camera Ops", location: "Arena" },
  { id: "cm4", type: "Clear-Com", channel: "PL-4", assignment: "Audio / Comms", location: "Truck" },
  { id: "cm5", type: "LQ", channel: "LQ-1", assignment: "ESPN NY ↔ Truck", location: "Transmission" },
  { id: "cm6", type: "LQ", channel: "LQ-2", assignment: "ESPN LA ↔ Truck", location: "Transmission" },
  { id: "cm7", type: "Hot Mic", channel: "HM-1", assignment: "Courtside Reporter", location: "Arena" },
  { id: "cm8", type: "Hot Mic", channel: "HM-2", assignment: "Sideline Analyst", location: "Arena" },
];

export const mockChanges: ChangeEntry[] = [
  { id: "ch1", label: "ISO 14 alias updated to 'Bench Close'", timestamp: "2026-02-22T14:30:00Z", status: "confirmed", author: "James Calloway" },
  { id: "ch2", label: "Encoder 8 reassigned to backup path", timestamp: "2026-02-22T11:00:00Z", status: "confirmed", author: "Marcus Reid" },
  { id: "ch3", label: "Add ISO 23 — Coach Cam request from ESPN", timestamp: "2026-02-22T09:00:00Z", status: "proposed", author: "Sarah Nguyen" },
  { id: "ch4", label: "Schedule: tipoff moved to 9:05 PM ET", timestamp: "2026-02-21T16:00:00Z", status: "confirmed", author: "Lisa Chen" },
  { id: "ch5", label: "Return feed audio mix change — add crowd mic", timestamp: "2026-02-21T14:00:00Z", status: "proposed", author: "Kevin O'Brien" },
  { id: "ch6", label: "Remove ISO 20 — Scoreboard cam not available", timestamp: "2026-02-21T10:00:00Z", status: "rejected", author: "Andre Williams" },
];

export const mockIssues: Issue[] = [
  { id: "i1", title: "Encoder 3 showing intermittent SRT drops", status: "open", priority: "high", assignee: "Marcus Reid", createdAt: "2026-02-22T13:00:00Z" },
  { id: "i2", title: "Arena patch panel mislabeled — rows C-D swapped", status: "open", priority: "medium", assignee: "Andre Williams", createdAt: "2026-02-22T10:00:00Z" },
  { id: "i3", title: "Return feed latency exceeds 250ms threshold", status: "escalated", priority: "high", assignee: "Diane Kowalski", createdAt: "2026-02-21T15:00:00Z" },
  { id: "i4", title: "Graphics overlay template missing team logos", status: "resolved", priority: "low", assignee: "Rachel Torres", createdAt: "2026-02-20T09:00:00Z" },
];

export const mockDocs: DocEntry[] = [
  { id: "d1", type: "Primer", name: "NBA Finals G3 — Production Primer v2", version: "2.0", uploadedBy: "Sarah Nguyen", uploadedAt: "2026-02-20T08:00:00Z", extractionStatus: "complete" },
  { id: "d2", type: "Call Sheet", name: "Game 3 Call Sheet — Final", version: "1.3", uploadedBy: "Lisa Chen", uploadedAt: "2026-02-21T12:00:00Z", extractionStatus: "complete" },
  { id: "d3", type: "Schedule", name: "Truck Schedule & Milestones", version: "1.1", uploadedBy: "James Calloway", uploadedAt: "2026-02-19T14:00:00Z", extractionStatus: "complete" },
  { id: "d4", type: "Diagram", name: "Signal Flow Diagram — Chase Center", version: "1.0", uploadedBy: "Marcus Reid", uploadedAt: "2026-02-18T10:00:00Z", extractionStatus: "pending" },
  { id: "d5", type: "Rundown", name: "Pre-Game Rundown", version: "3.0", uploadedBy: "Sarah Nguyen", uploadedAt: "2026-02-22T07:00:00Z", extractionStatus: "complete" },
];
