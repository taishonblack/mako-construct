export interface Signal {
  iso: number;
  productionAlias: string;
  onsitePatch: string;
  hqPatch: string;
  hqPatchCustomLabel: string;
  destination: string;
  transport: string;
  encoderInput: string;
  decoderOutput: string;
  txName: string;
  rxName: string;
}

export const CANONICAL_SIGNAL_NAMES = [
  "Speedy", "Supra", "Handheld Left", "Handheld Right",
  "Home Bench", "Away Bench", "Beauty", "Router",
  "Slash Left", "Slash Right", "High Home", "High Away",
  "Baseline Left", "Baseline Right", "Overhead", "Jib",
  "Steadicam", "Rail Low Left", "Rail Low Right",
  "Tunnel Cam", "Fan Cam", "Coach Cam", "Scoreboard",
  "Press Row", "Locker Room", "Aerial", "Sky Cam", "Ref Cam",
];

export const TRANSPORT_OPTIONS = ["SRT", "MPEG-TS", "Fiber", "RIST", "Other"];
export const DESTINATION_OPTIONS = ["Program", "ISO Record", "Backup", "Studio", "Partner", "Archive", "Multiview", "Other"];

const DEFAULT_ALIASES = [
  "Center Court Wide", "Slash Left", "Slash Right", "Baseline Left",
  "Baseline Right", "High Home", "High Away", "Bench Close",
  "Tunnel Cam", "Overhead", "Rail Low Left", "Rail Low Right",
  "Beauty Shot", "Handheld 1", "Handheld 2", "Steadicam",
  "Jib", "Iso Replay 1", "Iso Replay 2", "Scoreboard",
  "Fan Cam", "Ref Cam", "Coach Cam", "Press Row",
  "Locker Room", "Parking Deck", "Aerial", "Sky Cam",
];

export type SignalNamingMode = "iso" | "canonical" | "custom";

export function generateSignals(count: number, namingMode?: SignalNamingMode, customNames?: string[], canonicalNames?: string[]): Signal[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const padded = String(n).padStart(2, "0");

    let alias: string;
    if (namingMode === "canonical" && canonicalNames && i < canonicalNames.length) {
      alias = canonicalNames[i];
    } else if (namingMode === "custom" && customNames && i < customNames.length) {
      alias = customNames[i];
    } else {
      alias = DEFAULT_ALIASES[i] || `Camera ${n}`;
    }

    return {
      iso: n,
      productionAlias: alias,
      onsitePatch: `OP-${padded}`,
      hqPatch: `HQ-${padded}`,
      hqPatchCustomLabel: "",
      destination: n <= 8 ? "Program" : n <= 16 ? "ISO Record" : "Backup",
      transport: n % 5 === 0 ? "MPEG-TS" : "SRT",
      encoderInput: `ENC-${String(Math.ceil(n / 2)).padStart(2, "0")}:${n % 2 === 0 ? "B" : "A"}`,
      decoderOutput: `DEC-${padded}`,
      txName: "",
      rxName: "",
    };
  });
}

export function generatePatchpoints(type: "encoder" | "decoder", unitCount: number, portsPerUnit: number): string[] {
  const prefix = type === "encoder" ? "ENC" : "DEC";
  const portPrefix = type === "encoder" ? "IN" : "OUT";
  const points: string[] = [];
  for (let u = 1; u <= unitCount; u++) {
    for (let p = 1; p <= portsPerUnit; p++) {
      points.push(`${prefix}-${String(u).padStart(2, "0")} ${portPrefix}-${String(p).padStart(2, "0")}`);
    }
  }
  return points;
}

export function applyAliasScheme(signals: Signal[], scheme: string, prefix?: string, overwriteExisting?: boolean): Signal[] {
  return signals.map((s, i) => {
    if (!overwriteExisting && s.productionAlias && s.productionAlias !== `Camera ${s.iso}`) return s;
    let alias: string;
    switch (scheme) {
      case "iso": alias = `ISO ${s.iso}`; break;
      case "cam": alias = `Cam ${s.iso}`; break;
      case "game-iso": alias = `Game ISO ${s.iso}`; break;
      case "clean-iso": alias = `Clean ISO ${s.iso}`; break;
      case "custom": alias = `${prefix || "Sig"} ${s.iso}`; break;
      default: alias = s.productionAlias;
    }
    return { ...s, productionAlias: alias };
  });
}
