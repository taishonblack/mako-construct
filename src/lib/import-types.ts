// ─── Import Call Sheet Types ──────────────────────────────────

export type ImportSourceType = "callsheet" | "email" | "pdf" | "paste";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidentField<T> {
  value: T;
  confidence: ConfidenceLevel;
}

export interface ExtractedCallTime {
  label: string;
  time: string; // HH:mm
}

export interface ExtractedStaff {
  name: string;
  role: string;
  orgTag: string;
  email: string;
  phone: string;
}

export interface ExtractedTask {
  title: string;
  departmentTag: string;
  dueTime: string;
}

export interface ExtractedRouteHint {
  txId: string;
  isoName: string;
  source: string;
  encoder: string;
  transportType: string;
  decoder: string;
  router: string;
  output: string;
}

export interface CallSheetExtraction {
  showTitle: ConfidentField<string>;
  showDate: ConfidentField<string>;
  venue: ConfidentField<string>;
  controlRoom: ConfidentField<string>;
  callTimes: ConfidentField<ExtractedCallTime[]>;
  staff: ConfidentField<ExtractedStaff[]>;
  tasks: ConfidentField<ExtractedTask[]>;
  routeHints: ConfidentField<ExtractedRouteHint[]>;
}

export type BinderTarget = "new" | "existing";

export type TimelineOption = "full" | "crew-onair-wrap";

export type AssignmentBehavior = "auto" | "ask" | "unassigned";

export interface ImportPlan {
  binderTarget: BinderTarget;
  existingBinderId: string;
  controlRoom: string;
  createTimeline: boolean;
  timelineOption: TimelineOption;
  createTasks: boolean;
  assignmentBehavior: AssignmentBehavior;
  addMissingStaff: boolean;
  linkExistingStaff: boolean;
  updateRoutes: boolean;
  askAboutHops: boolean;
}

export interface ImportFileInfo {
  name: string;
  size: number;
  type: string;
  sourceType: ImportSourceType;
}

export interface ImportCreateItem {
  type: "binder" | "timeline" | "tasks" | "staff" | "routes";
  label: string;
  details: string[];
  enabled: boolean;
}

export const DEFAULT_IMPORT_PLAN: ImportPlan = {
  binderTarget: "new",
  existingBinderId: "",
  controlRoom: "Unknown",
  createTimeline: true,
  timelineOption: "full",
  createTasks: true,
  assignmentBehavior: "auto",
  addMissingStaff: true,
  linkExistingStaff: true,
  updateRoutes: true,
  askAboutHops: false,
};
