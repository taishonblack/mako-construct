/**
 * Quinn question engine – deterministic state machine for conversational binder creation.
 */
import type { QuinnField } from "@/lib/quinn-parser";

export type QuinnState = "IDLE" | "INTAKE" | "CLARIFY" | "CONFIRM" | "CREATE";

/** Question bank with multiple phrasings per field */
interface QuestionDef {
  field: QuinnField;
  phrasings: string[];
  quickReplies: string[];
  skipText: string;
}

const QUESTION_BANK: QuestionDef[] = [
  {
    field: "identity",
    phrasings: [
      "What's the project name?",
      "What should I name this binder?",
      "What matchup / show name should I use for the binder?",
    ],
    quickReplies: ["NYR @ BOS — Standard", "TOR @ MTL — Alt French Feed", "I'll type it"],
    skipText: "No problem — I'll use a temporary title. We can update it anytime.",
  },
  {
    field: "gameDate",
    phrasings: [
      "When is this project?",
      "What's the event date?",
      "What date should I put on the binder?",
    ],
    quickReplies: ["Today", "Tomorrow"],
    skipText: "No problem — we'll leave that blank for now. You can add it later in the Binder Draft panel.",
  },
  {
    field: "gameTime",
    phrasings: [
      "What's the on-air time?",
      "When is the show live / on-air?",
      "What time should I set for the show start?",
    ],
    quickReplies: ["7:00 PM", "8:00 PM"],
    skipText: "No problem — we'll leave that blank for now.",
  },
  {
    field: "timezone",
    phrasings: [
      "What timezone should I use?",
      "Should I record times in ET, PT, or another timezone?",
      "Which timezone should operators follow for this show?",
    ],
    quickReplies: ["ET", "PT", "CET"],
    skipText: "I'll default to ET.",
  },
  {
    field: "controlRoom",
    phrasings: [
      "Which control room is this show in?",
      "Is this in CR-23 or CR-26?",
      "Where should I route ops ownership — CR-23 or CR-26?",
    ],
    quickReplies: ["CR-23", "CR-26", "Remote"],
    skipText: "No problem — we'll leave that blank for now.",
  },
  {
    field: "venue",
    phrasings: [
      "What's the venue or facility name?",
      "Which arena is this?",
      "Where are ops located?",
    ],
    quickReplies: ["NHL Studios NYC", "Arena", "Remote"],
    skipText: "We can add the venue later.",
  },
  {
    field: "broadcastFeed",
    phrasings: [
      "What broadcast feed should we monitor?",
      "Which feed are we watching?",
      "Host feed or partner feed?",
    ],
    quickReplies: ["ESPN", "SportsNet", "World Feed"],
    skipText: "Got it — we'll set the feed later.",
  },
];

export interface QuestionResult {
  text: string;
  quickReplies: string[];
  field: QuinnField;
}

/** Tracks how many times each field has been asked */
export type AskCounts = Partial<Record<QuinnField, number>>;

/**
 * Get the next question Quinn should ask, based on missing fields and ask counts.
 * Returns undefined if nothing left to ask.
 */
export function getNextQuestion(
  missingFields: QuinnField[],
  askCounts: AskCounts,
  skippedFields: QuinnField[]
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
export function getSkipText(field: QuinnField): string {
  const def = QUESTION_BANK.find(q => q.field === field);
  return def?.skipText || "No problem — we'll leave that blank.";
}

/** Check if we have enough to create */
export function hasMinimumFields(draft: Record<string, any>): boolean {
  const hasIdentity = !!(draft.binderTitle || (draft.homeTeam && draft.awayTeam));
  const hasDate = !!draft.gameDate;
  return hasIdentity && hasDate;
}

/** Format the intro message */
export function getIntroMessage(): string {
  return "Hey — how can I help?";
}
