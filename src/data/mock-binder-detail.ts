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

export interface BinderDetail {
  id: string;
  title: string;
  partner: string;
  venue: string;
  eventDate: string;
  status: "draft" | "active" | "completed" | "archived";
  isoCount: number;
  openIssues: number;
  transport: string;
  backupTransport: string;
  returnFeed: boolean;
  encodersRequired: number;
  encodersAssigned: number;
  pendingConfirmations: number;
  recentChanges: { label: string; timestamp: string }[];
  schedule: ScheduleItem[];
  contacts: Contact[];
}

export const mockBinderDetail: BinderDetail = {
  id: "1",
  title: "NBA Finals Game 3",
  partner: "ESPN",
  venue: "Chase Center, San Francisco",
  eventDate: "2026-06-12",
  status: "active",
  isoCount: 22,
  openIssues: 3,
  transport: "SRT",
  backupTransport: "MPEG-TS",
  returnFeed: true,
  encodersRequired: 12,
  encodersAssigned: 10,
  pendingConfirmations: 2,
  recentChanges: [
    { label: "ISO 14 alias updated to 'Bench Close'", timestamp: "2026-02-22T14:30:00Z" },
    { label: "Encoder 8 reassigned to backup path", timestamp: "2026-02-22T11:00:00Z" },
    { label: "Schedule updated — tipoff moved to 9:05 PM ET", timestamp: "2026-02-21T16:00:00Z" },
  ],
  schedule: [
    { id: "s1", time: "17:00", label: "Truck Power On", detail: "All systems initialized, comms check begins.", type: "milestone" },
    { id: "s2", time: "18:00", label: "Signal Path Test", detail: "Encoder/decoder verification, SRT handshake confirmed.", type: "milestone" },
    { id: "s3", time: "18:30", label: "Camera Positions Set", detail: "All 22 ISOs confirm lock on positions.", type: "segment" },
    { id: "s4", time: "19:00", label: "Rehearsal / Dry Run", detail: "Full signal flow rehearsal with partner.", type: "segment" },
    { id: "s5", time: "19:30", label: "Talent Mic Check", detail: "On-air talent audio levels confirmed.", type: "segment" },
    { id: "s6", time: "20:00", label: "Pre-Show Package", detail: "Recorded segment playback.", type: "segment" },
    { id: "s7", time: "20:30", label: "Go Live — Pre-Game", detail: "Live coverage begins.", type: "milestone" },
    { id: "s8", time: "21:05", label: "Tipoff", detail: "Game start.", type: "milestone" },
    { id: "s9", time: "22:30", label: "Halftime", detail: "15-minute break, halftime show segment.", type: "break" },
    { id: "s10", time: "00:00", label: "Post-Game Wrap", detail: "Interviews, highlights, sign-off.", type: "segment" },
    { id: "s11", time: "00:30", label: "Signal Down", detail: "All feeds terminated, truck power-down begins.", type: "milestone" },
  ],
  contacts: [
    { id: "c1", name: "James Calloway", role: "Technical Director", location: "Truck", phone: "+1 415-555-0101", email: "j.calloway@espn.com" },
    { id: "c2", name: "Sarah Nguyen", role: "Producer", location: "Studio", phone: "+1 212-555-0202", email: "s.nguyen@espn.com" },
    { id: "c3", name: "Marcus Reid", role: "EIC (Engineer in Charge)", location: "Truck", phone: "+1 415-555-0303", email: "m.reid@nep.com" },
    { id: "c4", name: "Diane Kowalski", role: "Transmission Coordinator", location: "Transmission", phone: "+1 860-555-0404", email: "d.kowalski@espn.com" },
    { id: "c5", name: "Andre Williams", role: "Arena A/V Lead", location: "Arena", phone: "+1 415-555-0505", email: "a.williams@chasecenter.com" },
    { id: "c6", name: "Lisa Chen", role: "Partner Coordinator", location: "Partner", phone: "+1 310-555-0606", email: "l.chen@espn.com" },
    { id: "c7", name: "Kevin O'Brien", role: "Audio Engineer", location: "Truck", phone: "+1 415-555-0707", email: "k.obrien@nep.com" },
    { id: "c8", name: "Rachel Torres", role: "Graphics Operator", location: "Studio", phone: "+1 212-555-0808", email: "r.torres@espn.com" },
  ],
};
