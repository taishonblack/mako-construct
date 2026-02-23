export interface Signal {
  iso: number;
  productionAlias: string;
  onsitePatch: string;
  hqPatch: string;
  destination: string;
  transport: "SRT" | "MPEG-TS";
  encoderInput: string;
  decoderOutput: string;
}

export function generateSignals(count: number): Signal[] {
  const aliases = [
    "Center Court Wide", "Slash Left", "Slash Right", "Baseline Left",
    "Baseline Right", "High Home", "High Away", "Bench Close",
    "Tunnel Cam", "Overhead", "Rail Low Left", "Rail Low Right",
    "Beauty Shot", "Handheld 1", "Handheld 2", "Steadicam",
    "Jib", "Iso Replay 1", "Iso Replay 2", "Scoreboard",
    "Fan Cam", "Ref Cam", "Coach Cam", "Press Row",
    "Locker Room", "Parking Deck", "Aerial", "Sky Cam",
  ];

  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const padded = String(n).padStart(2, "0");
    return {
      iso: n,
      productionAlias: aliases[i] || `Camera ${n}`,
      onsitePatch: `OP-${padded}`,
      hqPatch: `HQ-${padded}`,
      destination: n <= 8 ? "Program" : n <= 16 ? "ISO Record" : "Backup",
      transport: n % 5 === 0 ? "MPEG-TS" : "SRT",
      encoderInput: `ENC-${String(Math.ceil(n / 2)).padStart(2, "0")}:${n % 2 === 0 ? "B" : "A"}`,
      decoderOutput: `DEC-${padded}`,
    };
  });
}
