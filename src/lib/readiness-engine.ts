import type { Signal } from "@/data/mock-signals";
import type { TransportConfig, Issue, CommEntry } from "@/data/mock-phase5";
import type { ChecklistItem } from "@/hooks/use-binder-state";

export type ReadinessLevel = "ready" | "risk" | "blocked";

export interface ReadinessReport {
  level: ReadinessLevel;
  reasons: string[];
  encoderCapacity: number;
  encoderRequired: number;
  encoderShortfall: number;
  decoderAssigned: number;
  decoderTotal: number;
  unassignedSignals: number;
  transportComplete: boolean;
  backupDefined: boolean;
  returnConfigured: boolean;
  blockingIssues: number;
  checklistComplete: number;
  checklistTotal: number;
  commsTotal: number;
  commsUnassigned: number;
  txRxMissing: number;
  staffAssigned: number;
  eventHeaderComplete: boolean;
}

export function computeReadiness(
  signals: Signal[],
  encodersAvailable: number,
  transport: TransportConfig,
  issues: Issue[],
  returnRequired: boolean,
  checklist: ChecklistItem[] = [],
  comms: CommEntry[] = [],
  eventHeader?: { projectTitle?: string; showDate?: string; staff?: { name: string }[]; controlRoom?: string },
): ReadinessReport {
  const encoderRequired = Math.ceil(signals.length / 2);
  const encoderShortfall = Math.max(0, encoderRequired - encodersAvailable);

  const decoderTotal = signals.length;
  const decoderAssigned = signals.filter((s) => s.decoderOutput).length;
  const unassignedSignals = signals.filter((s) => !s.destination).length;

  const transportComplete = !!transport.primary.protocol && !!transport.primary.destination;
  const backupDefined = !!transport.backup.protocol && !!transport.backup.destination;
  const returnConfigured = !returnRequired || transport.returnFeed;

  const blockingIssues = issues.filter(
    (i) => i.status !== "resolved" && i.priority === "high"
  ).length;

  const checklistComplete = checklist.filter((c) => c.checked).length;
  const checklistTotal = checklist.length;

  const reasons: string[] = [];
  let level: ReadinessLevel = "ready";

  if (encoderShortfall > 0) {
    reasons.push(`Encoder shortfall: ${encoderShortfall} inputs missing`);
    level = "blocked";
  }
  if (!transportComplete) {
    reasons.push("Primary transport not configured");
    level = "blocked";
  }
  if (!returnConfigured) {
    reasons.push("Return feed required but not configured");
    level = "blocked";
  }
  if (blockingIssues > 0) {
    reasons.push(`${blockingIssues} blocking issue${blockingIssues > 1 ? "s" : ""} open`);
    level = "blocked";
  }

  const commsTotal = comms.length;
  const commsUnassigned = comms.filter(c => !c.assignment.trim()).length;

  if (level !== "blocked") {
    if (!backupDefined) {
      reasons.push("No backup transport defined");
      level = "risk";
    }
    if (unassignedSignals > 0) {
      reasons.push(`${unassignedSignals} signal${unassignedSignals > 1 ? "s" : ""} unassigned`);
      level = "risk";
    }
    if (checklistTotal > 0 && checklistComplete < checklistTotal) {
      reasons.push(`Checklist: ${checklistComplete}/${checklistTotal} complete`);
      if (level !== "risk") level = "risk";
    }
    if (commsTotal === 0) {
      reasons.push("No comms channels configured");
      if (level !== "risk") level = "risk";
    } else if (commsUnassigned > 0) {
      reasons.push(`${commsUnassigned} comms channel${commsUnassigned > 1 ? "s" : ""} unassigned`);
      if (level !== "risk") level = "risk";
    }
  }

  // TX/RX completeness
  const txRxMissing = signals.filter(s => !s.txName || !s.rxName).length;
  if (level !== "blocked" && txRxMissing > 0) {
    reasons.push(`${txRxMissing} signal${txRxMissing > 1 ? "s" : ""} missing TX/RX names`);
    if (level !== "risk") level = "risk";
  }

  // Event header completeness
  const staffAssigned = eventHeader?.staff?.filter(s => s.name?.trim()).length ?? 0;
  const eventHeaderComplete = !!(eventHeader?.projectTitle?.trim() && eventHeader?.showDate);
  if (level !== "blocked" && !eventHeaderComplete) {
    reasons.push("Event header incomplete (title/date)");
    if (level !== "risk") level = "risk";
  }

  if (reasons.length === 0) {
    reasons.push("All systems configured");
  }

  return {
    level,
    reasons,
    encoderCapacity: encodersAvailable,
    encoderRequired,
    encoderShortfall,
    decoderAssigned,
    decoderTotal,
    unassignedSignals,
    transportComplete,
    backupDefined,
    returnConfigured,
    blockingIssues,
    checklistComplete,
    checklistTotal,
    commsTotal,
    commsUnassigned,
    txRxMissing,
    staffAssigned,
    eventHeaderComplete,
  };
}
