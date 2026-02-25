import { useState, useEffect, useCallback, useRef } from "react";
import type { NodeMetrics } from "@/stores/route-types";

export type NodeHealthStatus = "ok" | "warn" | "error" | "offline" | "unknown";

interface SimulatedNodeMetrics {
  nodeKey: string;
  status: NodeHealthStatus;
  metrics: NodeMetrics;
}

function generateMetrics(status: NodeHealthStatus): NodeMetrics {
  switch (status) {
    case "error":
    case "offline":
      return {
        latencyMs: 200 + Math.round(Math.random() * 800),
        packetLossPct: parseFloat((2 + Math.random() * 10).toFixed(1)),
        bitrateKbps: Math.round(Math.random() * 500),
      };
    case "warn":
      return {
        latencyMs: 80 + Math.round(Math.random() * 200),
        packetLossPct: parseFloat((0.5 + Math.random() * 2).toFixed(1)),
        bitrateKbps: 3000 + Math.round(Math.random() * 2000),
      };
    case "ok":
    default:
      return {
        latencyMs: 5 + Math.round(Math.random() * 30),
        packetLossPct: parseFloat((Math.random() * 0.1).toFixed(2)),
        bitrateKbps: 8000 + Math.round(Math.random() * 4000),
      };
  }
}

/**
 * Simulates real-time health metrics for route nodes.
 * Returns a map of nodeKey -> metrics, updated every `intervalMs`.
 */
export function useSimulatedMetrics(
  nodes: { key: string; status: NodeHealthStatus }[],
  intervalMs = 10000
) {
  const [metricsMap, setMetricsMap] = useState<Record<string, NodeMetrics>>({});
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const refresh = useCallback(() => {
    const map: Record<string, NodeMetrics> = {};
    for (const n of nodesRef.current) {
      map[n.key] = generateMetrics(n.status);
    }
    setMetricsMap(map);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [refresh, intervalMs]);

  return metricsMap;
}

/** Format a metric value for display on a node card */
export function formatMetricLine(metrics: NodeMetrics, status: NodeHealthStatus): string | null {
  if (status === "ok" || status === "unknown") return null;
  if (status === "offline") return "No signal";
  // Show most alarming metric
  if (metrics.packetLossPct >= 2) return `Loss ${metrics.packetLossPct}%`;
  if (metrics.latencyMs >= 150) return `Latency ${metrics.latencyMs}ms`;
  if (metrics.bitrateKbps < 1000) return `Bitrate ${metrics.bitrateKbps}kbps`;
  return `Loss ${metrics.packetLossPct}% · ${metrics.latencyMs}ms`;
}
