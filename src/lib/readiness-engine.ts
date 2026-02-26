import type { Signal } from "@/lib/signal-utils";
import type { TransportConfig, Issue, CommEntry } from "@/lib/binder-types";
import type { ChecklistItem } from "@/hooks/use-binder-state";
import type { SignalRoute } from "@/stores/route-store";

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
  audioConfigured: boolean;
  // Route validation
  orphanDecoders: number;
  duplicateSrtPorts: number;
  unmappedRoutes: number;
  routeValidationErrors: string[];
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
  audioPhilosophy?: { outputMode?: string; natsSource?: string; announcerRouting?: string },
  routes?: SignalRoute[],
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

  // Comms validation removed for NHL V1 — only LQ ports matter now
  const commsTotal = 0;
  const commsUnassigned = 0;

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

  // Audio Philosophy completeness
  const audioConfigured = !!(audioPhilosophy?.outputMode && audioPhilosophy?.natsSource && audioPhilosophy?.announcerRouting);
  if (level !== "blocked" && !audioConfigured) {
    reasons.push("Audio philosophy incomplete (output mode / nats / routing)");
    if (level !== "risk") level = "risk";
  }

  // --- Route validation ---
  const routeValidationErrors: string[] = [];
  let orphanDecoders = 0;
  let duplicateSrtPorts = 0;
  let unmappedRoutes = 0;

  if (routes && routes.length > 0) {
    // Orphan decoders: decoder defined but no router mapping
    orphanDecoders = routes.filter(r =>
      r.decoder.deviceName && (!r.routerMapping.router || !r.routerMapping.inputCrosspoint)
    ).length;
    if (orphanDecoders > 0) {
      routeValidationErrors.push(`${orphanDecoders} orphan decoder${orphanDecoders > 1 ? "s" : ""} (no router patch)`);
    }

    // Duplicate SRT ports
    const srtPorts = routes
      .filter(r => r.transport.type.startsWith("SRT") && r.transport.port)
      .map(r => `${r.transport.srtAddress}:${r.transport.port}`);
    const portSet = new Set<string>();
    const dupes = new Set<string>();
    for (const p of srtPorts) {
      if (portSet.has(p)) dupes.add(p);
      portSet.add(p);
    }
    duplicateSrtPorts = dupes.size;
    if (duplicateSrtPorts > 0) {
      routeValidationErrors.push(`${duplicateSrtPorts} duplicate SRT port${duplicateSrtPorts > 1 ? "s" : ""}`);
    }

    // Unmapped routes: missing TX→RX→Router→Alias chain
    unmappedRoutes = routes.filter(r =>
      !r.signalSource.signalName ||
      !r.encoder.deviceName ||
      !r.transport.type ||
      !r.decoder.deviceName ||
      !r.routerMapping.router ||
      !r.alias.productionName
    ).length;
    if (unmappedRoutes > 0) {
      routeValidationErrors.push(`${unmappedRoutes} route${unmappedRoutes > 1 ? "s" : ""} incomplete (TX→RX→Router→Alias)`);
    }

    // Add to main reasons
    if (routeValidationErrors.length > 0) {
      for (const err of routeValidationErrors) {
        reasons.push(err);
      }
      if (orphanDecoders > 0 || duplicateSrtPorts > 0) {
        level = "blocked";
      } else if (level !== "blocked") {
        level = "risk";
      }
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
    checklistComplete,
    checklistTotal,
    commsTotal,
    commsUnassigned,
    txRxMissing,
    staffAssigned,
    eventHeaderComplete,
    audioConfigured,
    orphanDecoders,
    duplicateSrtPorts,
    unmappedRoutes,
    routeValidationErrors,
  };
}
