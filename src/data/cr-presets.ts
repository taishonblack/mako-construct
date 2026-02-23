import type { StaffEntry, InternalLQEntry, EventCommandHeaderData } from "@/components/command/EventCommandHeader";

export interface CRPreset {
  label: string;
  staff: StaffEntry[];
  internalLQ: InternalLQEntry[];
  externalLQPorts: { E: string; F: string; G: string; H: string };
  rxFormat: string;
  decoderNamingNote: string;
}

export const CR_PRESETS: Record<"23" | "26", CRPreset> = {
  "23": {
    label: "CR-23",
    staff: [
      { id: "s-cr23-1", role: "Producer", name: "", panelPosition: "CR23-POS-01" },
      { id: "s-cr23-2", role: "Director", name: "", panelPosition: "CR23-POS-02" },
      { id: "s-cr23-3", role: "TD", name: "", panelPosition: "CR23-POS-03" },
      { id: "s-cr23-4", role: "Audio A1", name: "", panelPosition: "CR23-POS-04" },
      { id: "s-cr23-5", role: "Audio A2", name: "", panelPosition: "CR23-POS-05" },
      { id: "s-cr23-6", role: "Graphics", name: "", panelPosition: "CR23-POS-06" },
      { id: "s-cr23-7", role: "EVS 1", name: "", panelPosition: "CR23-POS-07" },
      { id: "s-cr23-8", role: "EVS 2", name: "", panelPosition: "CR23-POS-08" },
      { id: "s-cr23-9", role: "Shader", name: "", panelPosition: "CR23-POS-09" },
      { id: "s-cr23-10", role: "Tape", name: "", panelPosition: "CR23-POS-10" },
    ],
    internalLQ: [
      { id: "lq-cr23-1", person: "", role: "Producer", lqPosition: "CR23-LQ-01" },
      { id: "lq-cr23-2", person: "", role: "Director", lqPosition: "CR23-LQ-02" },
      { id: "lq-cr23-3", person: "", role: "TD", lqPosition: "CR23-LQ-03" },
      { id: "lq-cr23-4", person: "", role: "Audio", lqPosition: "CR23-LQ-04" },
      { id: "lq-cr23-5", person: "", role: "Transmission", lqPosition: "CR23-LQ-05" },
      { id: "lq-cr23-6", person: "", role: "Tech Manager", lqPosition: "CR23-LQ-06" },
    ],
    externalLQPorts: {
      E: "Arena Truck PL",
      F: "Arena Audio",
      G: "Remote Studio",
      H: "Master Control",
    },
    rxFormat: "RX-CR23-DEC{##}-{OUT##}",
    decoderNamingNote: "CR-23 decoders use DEC-01 through DEC-24 rack, 4 outputs per unit.",
  },
  "26": {
    label: "CR-26",
    staff: [
      { id: "s-cr26-1", role: "Producer", name: "", panelPosition: "CR26-POS-01" },
      { id: "s-cr26-2", role: "Director", name: "", panelPosition: "CR26-POS-02" },
      { id: "s-cr26-3", role: "TD", name: "", panelPosition: "CR26-POS-03" },
      { id: "s-cr26-4", role: "Audio A1", name: "", panelPosition: "CR26-POS-04" },
      { id: "s-cr26-5", role: "Graphics Lead", name: "", panelPosition: "CR26-POS-05" },
      { id: "s-cr26-6", role: "Graphics 2", name: "", panelPosition: "CR26-POS-06" },
      { id: "s-cr26-7", role: "EVS 1", name: "", panelPosition: "CR26-POS-07" },
      { id: "s-cr26-8", role: "EVS 2", name: "", panelPosition: "CR26-POS-08" },
      { id: "s-cr26-9", role: "EVS 3", name: "", panelPosition: "CR26-POS-09" },
      { id: "s-cr26-10", role: "Shader", name: "", panelPosition: "CR26-POS-10" },
      { id: "s-cr26-11", role: "Tape / Server", name: "", panelPosition: "CR26-POS-11" },
      { id: "s-cr26-12", role: "SMT Operator", name: "", panelPosition: "CR26-POS-12" },
    ],
    internalLQ: [
      { id: "lq-cr26-1", person: "", role: "Producer", lqPosition: "CR26-LQ-01" },
      { id: "lq-cr26-2", person: "", role: "Director", lqPosition: "CR26-LQ-02" },
      { id: "lq-cr26-3", person: "", role: "TD", lqPosition: "CR26-LQ-03" },
      { id: "lq-cr26-4", person: "", role: "Audio", lqPosition: "CR26-LQ-04" },
      { id: "lq-cr26-5", person: "", role: "SMT", lqPosition: "CR26-LQ-05" },
      { id: "lq-cr26-6", person: "", role: "Transmission", lqPosition: "CR26-LQ-06" },
      { id: "lq-cr26-7", person: "", role: "Tech Manager", lqPosition: "CR26-LQ-07" },
      { id: "lq-cr26-8", person: "", role: "Remote Talent", lqPosition: "CR26-LQ-08" },
    ],
    externalLQPorts: {
      E: "Arena Truck PL",
      F: "Arena Audio / Nats",
      G: "Remote Talent Studio",
      H: "ESPN Master Control",
    },
    rxFormat: "RX-CR26-DEC{##}-{OUT##}",
    decoderNamingNote: "CR-26 decoders use DEC-01 through DEC-28 rack, 4 outputs per unit. Extended for high-density shows.",
  },
};

/**
 * Apply a CR preset to an EventCommandHeaderData object.
 * Preserves names that were already filled in if possible.
 */
export function applyCRPreset(
  current: EventCommandHeaderData,
  cr: "23" | "26",
): EventCommandHeaderData {
  const preset = CR_PRESETS[cr];

  // Merge staff: keep names from current if role matches
  const mergedStaff = preset.staff.map((ps) => {
    const existing = current.staff.find(
      (cs) => cs.role.toLowerCase() === ps.role.toLowerCase() && cs.name.trim()
    );
    return existing
      ? { ...ps, name: existing.name }
      : { ...ps };
  });

  // Merge LQ: same logic
  const mergedLQ = preset.internalLQ.map((pl) => {
    const existing = current.internalLQ.find(
      (cl) => cl.role.toLowerCase() === pl.role.toLowerCase() && cl.person.trim()
    );
    return existing
      ? { ...pl, person: existing.person }
      : { ...pl };
  });

  return {
    ...current,
    controlRoom: cr,
    staff: mergedStaff,
    internalLQ: mergedLQ,
    externalLQPorts: { ...preset.externalLQPorts },
    rxFormat: preset.rxFormat,
  };
}
