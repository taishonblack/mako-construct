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
    title: "NBA Finals Game 3",
    partner: "ESPN",
    venue: "Chase Center, San Francisco",
    eventDate: "2026-06-12",
    status: "active",
    isoCount: 22,
    openIssues: 3,
    transport: "SRT",
    updatedAt: "2026-02-22T14:30:00Z",
  },
  {
    id: "2",
    title: "NFL Wild Card — DAL vs PHI",
    partner: "FOX Sports",
    venue: "Lincoln Financial Field",
    eventDate: "2026-01-11",
    status: "completed",
    isoCount: 18,
    openIssues: 0,
    transport: "MPEG-TS",
    updatedAt: "2026-01-12T09:00:00Z",
  },
  {
    id: "3",
    title: "MLS Cup Final",
    partner: "Apple TV",
    venue: "Lower.com Field, Columbus",
    eventDate: "2026-12-07",
    status: "draft",
    isoCount: 14,
    openIssues: 5,
    transport: "SRT",
    updatedAt: "2026-02-20T11:15:00Z",
  },
  {
    id: "4",
    title: "NHL Opening Night — NYR vs BOS",
    partner: "TNT Sports",
    venue: "Madison Square Garden",
    eventDate: "2026-10-08",
    status: "active",
    isoCount: 16,
    openIssues: 1,
    transport: "SRT",
    updatedAt: "2026-02-21T16:45:00Z",
  },
  {
    id: "5",
    title: "College Football Playoff Semi",
    partner: "ESPN",
    venue: "Mercedes-Benz Stadium, Atlanta",
    eventDate: "2026-12-31",
    status: "draft",
    isoCount: 24,
    openIssues: 8,
    transport: "MPEG-TS",
    updatedAt: "2026-02-19T08:30:00Z",
  },
  {
    id: "6",
    title: "WNBA All-Star Game",
    partner: "ABC",
    venue: "Barclays Center, Brooklyn",
    eventDate: "2026-07-15",
    status: "archived",
    isoCount: 12,
    openIssues: 0,
    transport: "SRT",
    updatedAt: "2026-07-16T10:00:00Z",
  },
];
