export type Confidence = "high" | "medium" | "low";

export interface CallTimeEntry {
  time: string;
  label: string;
  category?: "production" | "engineering" | "talent" | "general";
}

export interface StaffEntry {
  name: string;
  role: string;
  department?: "production" | "engineering" | "audio" | "operations" | "talent" | "other";
  email?: string;
  phone?: string;
}

export interface TaskEntry {
  title: string;
  departmentTag: "engineering" | "transmission" | "audio" | "production" | "operations" | "other";
  dueTime?: string;
}

export interface RouteHintEntry {
  txId: string;
  isoName?: string;
  source?: string;
  encoder?: string;
  transportType?: string;
  decoder?: string;
  router?: string;
  output?: string;
}

export interface CallSheetExtraction {
  showTitle: string;
  showTitleConfidence: Confidence;
  showDate: string;
  showDateConfidence: Confidence;
  airTime: string;
  airTimeConfidence: Confidence;
  venue: string;
  venueConfidence: Confidence;
  facility?: string;
  facilityConfidence?: Confidence;
  controlRoom: string;
  controlRoomConfidence: Confidence;
  productionType?: string;
  productionTypeConfidence?: Confidence;
  league?: string;
  homeTeam?: string;
  awayTeam?: string;
  callTimes: CallTimeEntry[];
  staff: StaffEntry[];
  tasks: TaskEntry[];
  routeHints?: RouteHintEntry[];
  accessInstructions?: string;
  notes?: string;
}

export type ImportTarget = "new" | "existing";

export interface ImportPlan {
  target: ImportTarget;
  existingBinderId?: string;
  controlRoom: string;
  createTimeline: boolean;
  timelineScope: "full" | "key-only";
  createTasks: boolean;
  taskAssignment: "auto" | "ask" | "unassigned";
  addStaff: boolean;
  linkExisting: boolean;
  updateRoutes: boolean;
}

export type ImportStep = 1 | 2 | 3;

export interface ImportFileInfo {
  name: string;
  size: number;
  type: string; // pdf, eml, txt
  content?: string; // text content for parsing
}
