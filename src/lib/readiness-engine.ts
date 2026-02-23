import type { Signal } from "@/data/mock-signals";
import type { TransportConfig, Issue } from "@/data/mock-phase5";

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
}

export function computeReadiness(
  signals: Signal[],
  encodersAvailable: number,
  transport: TransportConfig,
  issues: Issue[],
  returnRequired: boolean,
): ReadinessReport {
  const encoderRequired = Math.ceil(signals.length / 2);
  const encoderShortfall = Math.max(0, encoderRequired - encodersAvailable);

  // Decoder mapping — all signals have decoder outputs in our model
  const decoderTotal = signals.length;
  const decoderAssigned = signals.filter((s) => s.decoderOutput).length;

  // Unassigned signals (no destination)
  const unassignedSignals = signals.filter((s) => !s.destination).length;

  // Transport
  const transportComplete = !!transport.primary.protocol && !!transport.primary.destination;
  const backupDefined = !!transport.backup.protocol && !!transport.backup.destination;

  // Return
  const returnConfigured = !returnRequired || transport.returnFeed;

  // Issues
  const blockingIssues = issues.filter(
    (i) => i.status !== "resolved" && i.priority === "high"
  ).length;

  // Compute level
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

  if (level !== "blocked") {
    if (!backupDefined) {
      reasons.push("No backup transport defined");
      level = "risk";
    }
    if (unassignedSignals > 0) {
      reasons.push(`${unassignedSignals} signal${unassignedSignals > 1 ? "s" : ""} unassigned`);
      level = "risk";
    }
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
  };
}
