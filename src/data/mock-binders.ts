export type BinderStatus = "draft" | "active" | "completed" | "archived";

export interface MockBinder {
  id: string;
  title: string;
  partner: string;
  venue: string;
  eventDate: string;
  status: BinderStatus;
  isoCount: number;
  openIssues: number;
  transport: string;
  updatedAt: string;
}

export const mockBinders: MockBinder[] = [
  {
    id: "1",
    title: "NYR @ BOS — Standard",
    partner: "TNT Sports",
    venue: "TD Garden, Boston",
    eventDate: "2026-10-08",
    status: "active",
    isoCount: 18,
    openIssues: 1,
    transport: "SRT",
    updatedAt: "2026-02-22T14:30:00Z",
  },
  {
    id: "2",
    title: "TOR @ MTL — Alt French Feed",
    partner: "SportsNet",
    venue: "Bell Centre, Montreal",
    eventDate: "2026-10-12",
    status: "active",
    isoCount: 12,
    openIssues: 3,
    transport: "SRT",
    updatedAt: "2026-02-21T16:45:00Z",
  },
  {
    id: "3",
    title: "COL @ VGK — Standard",
    partner: "ESPN",
    venue: "T-Mobile Arena, Las Vegas",
    eventDate: "2026-11-15",
    status: "draft",
    isoCount: 16,
    openIssues: 5,
    transport: "SRT",
    updatedAt: "2026-02-20T11:15:00Z",
  },
  {
    id: "4",
    title: "EDM @ DAL — Playoffs R1 G3",
    partner: "ESPN",
    venue: "American Airlines Center, Dallas",
    eventDate: "2026-04-22",
    status: "completed",
    isoCount: 22,
    openIssues: 0,
    transport: "SRT",
    updatedAt: "2026-01-12T09:00:00Z",
  },
  {
    id: "5",
    title: "PIT @ CHI — Winter Classic 2026",
    partner: "TNT Sports",
    venue: "Wrigley Field, Chicago",
    eventDate: "2026-01-01",
    status: "draft",
    isoCount: 24,
    openIssues: 8,
    transport: "MPEG-TS",
    updatedAt: "2026-02-19T08:30:00Z",
  },
  {
    id: "6",
    title: "SEA @ VAN — Stadium Series",
    partner: "ABC",
    venue: "BC Place, Vancouver",
    eventDate: "2026-02-21",
    status: "archived",
    isoCount: 20,
    openIssues: 0,
    transport: "SRT",
    updatedAt: "2026-02-22T10:00:00Z",
  },
];
