/**
 * Quinn question engine – deterministic state machine for conversational binder creation.
 * Uses exact copy from spec with rotating alternates.
 */
import type { QuinnField } from "@/lib/quinn-parser";

export type QuinnState = "IDLE" | "INTAKE" | "CLARIFY" | "CONFIRM" | "CREATE" | "ROUTES_BUILD" | "ROUTES_CONFIRM";

/** Extended field type for the full 13-question intake */
export type QuinnIntakeField =
  | "identity"
  | "gameDate"
  | "gameTime"
  | "timezone"
  | "controlRoom"
  | "venue"
  | "broadcastFeed"
  | "techManager"
  | "teams"
  | "returnFeed"
  | "isoCount"
  | "encoderBrand"
  | "decoderBrand"
  | "lq"
  | "notes";

/** Question bank with exact spec phrasings */
interface QuestionDef {
  field: QuinnIntakeField;
  phrasings: string[];
  quickReplies: string[];
  skipText: string;
}

const QUESTION_BANK: QuestionDef[] = [
  {
    field: "identity",
    phrasings: [
      "what is the project name",
      "what should this binder be called",
      "what name do you want for this binder",
    ],
    quickReplies: ["I'll type it"],
    skipText: "no problem — I'll use a temporary title.",
  },
  {
    field: "gameDate",
    phrasings: [
      "when it is",
      "what is the date and time",
      "what day is this for",
    ],
    quickReplies: ["Today", "Tomorrow"],
    skipText: "we'll leave that blank for now.",
  },
  {
    field: "techManager",
    phrasings: [
      "do you have tech manager? If not TBD.",
      "who is the tech manager (or TBD)",
      "tech manager name? (or TBD)",
    ],
    quickReplies: ["TBD"],
    skipText: "I'll mark the tech manager as TBD.",
  },
  {
    field: "teams",
    phrasings: [
      "Is the binder associated with a game and what team?",
      "is this tied to a game — what teams",
      "which teams are playing (if this is a game)",
    ],
    quickReplies: ["No game", "I'll type it"],
    skipText: "no game association — got it.",
  },
  {
    field: "broadcastFeed",
    phrasings: [
      "Who's the partner for this broadcast feed?",
      "which partner is this for",
      "who is the broadcast partner",
    ],
    quickReplies: ["ESPN", "SportsNet", "TNT"],
    skipText: "we'll set the partner later.",
  },
  {
    field: "controlRoom",
    phrasings: [
      "Which control room are you using?",
      "CR-23 or CR-26",
      "what control room is this in",
    ],
    quickReplies: ["CR-23", "CR-26", "Remote"],
    skipText: "we'll leave that blank for now.",
  },
  {
    field: "returnFeed",
    phrasings: [
      "Do you need a return feed from the parent?",
      "do you need return",
      "is a return feed required",
    ],
    quickReplies: ["Yes", "No"],
    skipText: "I'll assume no return feed.",
  },
  {
    field: "isoCount",
    phrasings: [
      "How many ISO signals from the arena are you attempting to require?",
      "how many ISOs do you need",
      "ISO count?",
    ],
    quickReplies: ["6", "12", "18"],
    skipText: "I'll default to 12 ISOs.",
  },
  {
    field: "encoderBrand",
    phrasings: [
      "What brand of encoding devices are you using at the arena?",
      "encoder brand? (or TBD)",
      "what encoder are you using (or TBD)",
    ],
    quickReplies: ["Videon", "Haivision", "TBD"],
    skipText: "I'll mark encoder as TBD.",
  },
  {
    field: "venue",
    phrasings: [
      "Which arena is it?",
      "what venue is this at",
      "where is the arena",
    ],
    quickReplies: ["NHL Studios NYC", "I'll type it"],
    skipText: "we can add the venue later.",
  },
  {
    field: "decoderBrand",
    phrasings: [
      "Do you know what type of decoders you are using are? If not TBD.",
      "decoder type? (or TBD)",
      "what decoder brand (or TBD)",
    ],
    quickReplies: ["Haivision", "TBD"],
    skipText: "I'll mark decoder as TBD.",
  },
  {
    field: "lq",
    phrasings: [
      "Will you need an LQ for external coms?",
      "do you need LQ",
      "LQ required?",
    ],
    quickReplies: ["Yes", "No"],
    skipText: "I'll assume no LQ.",
  },
  {
    field: "notes",
    phrasings: [
      "Any other notes.",
      "any notes to add",
      "anything else to capture",
    ],
    quickReplies: ["No notes", "Skip"],
    skipText: "no notes — got it.",
  },
];

export interface QuestionResult {
  text: string;
  quickReplies: string[];
  field: QuinnIntakeField;
}

/** Tracks how many times each field has been asked */
export type AskCounts = Partial<Record<QuinnIntakeField, number>>;

/**
 * Get the next question Quinn should ask, based on missing fields and ask counts.
 * Returns undefined if nothing left to ask.
 */
export function getNextQuestion(
  missingFields: (QuinnField | QuinnIntakeField)[],
  askCounts: AskCounts,
  skippedFields: (QuinnField | QuinnIntakeField)[]
): QuestionResult | undefined {
  for (const def of QUESTION_BANK) {
    if (!missingFields.includes(def.field)) continue;
    if (skippedFields.includes(def.field)) continue;
    const count = askCounts[def.field] || 0;
    if (count >= 2) continue; // stop after 2 attempts
    const phraseIdx = count % def.phrasings.length;
    return {
      text: def.phrasings[phraseIdx],
      quickReplies: [...def.quickReplies, "Skip"],
      field: def.field,
    };
  }
  return undefined;
}

/** Get the skip text for a field */
export function getSkipText(field: QuinnIntakeField | QuinnField): string {
  const def = QUESTION_BANK.find(q => q.field === field);
  return def?.skipText || "no problem — we'll leave that blank.";
}

/** Check if we have enough to create */
export function hasMinimumFields(draft: Record<string, any>): boolean {
  const hasIdentity = !!(draft.binderTitle || (draft.homeTeam && draft.awayTeam));
  const hasDate = !!draft.gameDate;
  return hasIdentity && hasDate;
}

/** The exact start-of-chat messages */
export function getIntroMessages(): { text: string; quickReplies?: string[] }[] {
  return [
    { text: "hello how are you?" },
    { text: "What would you like to work on today" },
  ];
}

/** Help chips when user doesn't know what to do */
export const HELP_CHIPS = [
  "build a binder",
  "get an overview of routes",
  "ask for the upcoming projects",
  "find staff",
  "look up something in the wiki",
];

/** Get all intake fields still missing from a draft */
export function getMissingIntakeFields(draft: Record<string, any>): QuinnIntakeField[] {
  const missing: QuinnIntakeField[] = [];
  if (!draft.binderTitle && (!draft.homeTeam || !draft.awayTeam)) missing.push("identity");
  if (!draft.gameDate) missing.push("gameDate");
  if (!draft.onsiteTechManager) missing.push("techManager");
  if (!draft.homeTeam && !draft.awayTeam) missing.push("teams");
  if (!draft.broadcastFeed) missing.push("broadcastFeed");
  if (!draft.controlRoom) missing.push("controlRoom");
  if (draft.returnRequired === undefined) missing.push("returnFeed");
  if (!draft.isoCount || draft.isoCount === 12) missing.push("isoCount");
  if (!draft.encoderBrand) missing.push("encoderBrand");
  if (!draft.venue) missing.push("venue");
  if (!draft.decoderBrand) missing.push("decoderBrand");
  if (draft.lqRequired === undefined) missing.push("lq");
  if (!draft.notes) missing.push("notes");
  return missing;
}
