/** Partner-aware alias dictionaries for ISO routing */

export interface PartnerAliasConfig {
  partner: string;
  aliases: Record<string, string[]>;
}

/** Per-partner alias suggestions for common signal types */
export const PARTNER_ALIASES: Record<string, string[]> = {
  ESPN: [
    "EL HH", "ER HH", "E Center", "E Slash L", "E Slash R",
    "E High Home", "E High Away", "E Beauty", "E Jib",
    "E Steadicam", "E Rail L", "E Rail R", "E Overhead",
    "E Tunnel", "E Fan Cam", "E Ref Cam", "E Coach Cam",
  ],
  "SportsNet CA": [
    "SN HH L", "SN HH R", "SN Center", "SN Slash L", "SN Slash R",
    "SN High Home", "SN High Away", "SN Beauty", "SN Jib",
    "SN Steady", "SN Rail L", "SN Rail R", "SN Overhead",
    "SN Tunnel", "SN Fan", "SN Ref", "SN Coach",
  ],
  WBD: [
    "WBD HH L", "WBD HH R", "WBD Center", "WBD Slash L", "WBD Slash R",
    "WBD High Home", "WBD High Away", "WBD Beauty", "WBD Jib",
    "WBD Steady", "WBD Rail L", "WBD Rail R", "WBD Overhead",
  ],
  Amazon: [
    "AMZ HH L", "AMZ HH R", "AMZ Center", "AMZ Slash L", "AMZ Slash R",
    "AMZ High Home", "AMZ High Away", "AMZ Beauty", "AMZ Jib",
    "AMZ Steady", "AMZ Rail L", "AMZ Rail R", "AMZ Overhead",
  ],
  Fanatics: [
    "FAN HH L", "FAN HH R", "FAN Center", "FAN Slash L", "FAN Slash R",
    "FAN Beauty", "FAN Jib", "FAN Overhead",
  ],
  Altitude: [
    "ALT HH L", "ALT HH R", "ALT Center", "ALT Beauty",
    "ALT Slash L", "ALT Slash R", "ALT Overhead",
  ],
};

/** Generic aliases used when no partner is selected */
export const GENERIC_ALIASES = [
  "ISO 1", "ISO 2", "ISO 3", "ISO 4", "ISO 5", "ISO 6",
  "ISO 7", "ISO 8", "ISO 9", "ISO 10", "ISO 11", "ISO 12",
  "ISO 13", "ISO 14", "ISO 15", "ISO 16", "ISO 17", "ISO 18",
  "ISO 19", "ISO 20", "ISO 21", "ISO 22", "ISO 23", "ISO 24",
];

export function getAliasesForPartner(partner: string): string[] {
  return PARTNER_ALIASES[partner] || GENERIC_ALIASES;
}

/** Embedded audio mode options */
export type EmbAudioMode = "none" | "hot-mics" | "full-mix" | "custom";

export const EMB_AUDIO_MODES: { value: EmbAudioMode; label: string }[] = [
  { value: "none", label: "None" },
  { value: "hot-mics", label: "Hot Mics" },
  { value: "full-mix", label: "Full Mix" },
  { value: "custom", label: "Custom" },
];

/** Video format options */
export const VIDEO_FORMATS = [
  "1080i59.94",
  "720p",
  "1080p",
  "Custom",
];

/** Source type options */
export const SOURCE_TYPES = [
  "Camera", "Router", "Replay", "Graphics", "External", "Other",
];

/** Destination type options */
export const DESTINATION_TYPES = [
  "Program", "ISO Record", "Backup", "Studio", "Partner", "Archive", "Multiview", "Other",
];

/** Audio channel mapping for embedded audio */
export interface AudioChannelMap {
  channel: number;
  label: string;
  source: string;
  notes: string;
}

/** Extended ISO routing row */
export interface IsoRoutingRow {
  id: string;
  isoNumber: number;
  productionAlias: string;
  sourceType: string;
  sourceSignal: string;
  destinationType: string;
  destinationPath: string;
  embAudioMode: EmbAudioMode;
  embAudioChannelCount: number;
  embAudioChannels: AudioChannelMap[];
  format: string;
  notes: string;
  sortOrder: number;
  // Legacy compat
  encoderInput: string;
  decoderOutput: string;
  txName: string;
  rxName: string;
  transport: string;
  linkedRouteId: string;
}

export function createDefaultIsoRow(isoNumber: number): IsoRoutingRow {
  const padded = String(isoNumber).padStart(2, "0");
  return {
    id: `iso-${Date.now()}-${isoNumber}`,
    isoNumber,
    productionAlias: `ISO ${padded}`,
    sourceType: "Camera",
    sourceSignal: "",
    destinationType: isoNumber <= 8 ? "Program" : "ISO Record",
    destinationPath: "",
    embAudioMode: "none",
    embAudioChannelCount: 2,
    embAudioChannels: [],
    format: "1080i59.94",
    notes: "",
    sortOrder: isoNumber,
    encoderInput: "",
    decoderOutput: "",
    txName: "",
    rxName: "",
    transport: "SRT",
    linkedRouteId: "",
  };
}
