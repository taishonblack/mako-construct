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

export interface ScheduleItem {
  id: string;
  time: string;
  label: string;
  detail: string;
  type: "milestone" | "segment" | "break";
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  location: string;
  phone: string;
  email: string;
}

export const DEFAULT_TRANSPORT: TransportConfig = {
  primary: { protocol: "SRT", destination: "", port: 9000, latency: "120ms", encryption: true },
  backup: { protocol: "", destination: "", port: 5000, latency: "200ms", encryption: false },
  returnFeed: false,
  commercials: "local-insert",
  notes: "",
};
