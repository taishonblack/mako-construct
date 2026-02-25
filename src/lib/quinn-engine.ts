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
      "What's the show matchup or title?",
      "Which teams are playing?",
      "What should we call this binder?",
    ],
    quickReplies: ["NYR @ BOS", "TOR @ MTL", "Just a title…"],
    skipText: "No problem — I'll use a temporary title. We can update it anytime.",
  },
  {
    field: "gameDate",
    phrasings: [
      "What's the show date?",
      "When is this airing?",
      "Confirm the broadcast date.",
    ],
    quickReplies: ["Today", "Tomorrow"],
    skipText: "Okay — I'll leave the date blank for now.",
  },
  {
    field: "gameTime",
    phrasings: [
      "What's the on-air time?",
      "What time are we live?",
      "Give me the broadcast time.",
    ],
    quickReplies: ["7:00 PM", "8:00 PM"],
    skipText: "No problem — I'll leave time open for now.",
  },
  {
    field: "timezone",
    phrasings: [
      "Which timezone should I use?",
      "ET, PT, or something else?",
      "Confirm timezone.",
    ],
    quickReplies: ["ET", "PT", "CET"],
    skipText: "I'll default to ET.",
  },
  {
    field: "controlRoom",
    phrasings: [
      "Which control room?",
      "Is this CR-23 or CR-26?",
      "Confirm room assignment.",
    ],
    quickReplies: ["CR-23", "CR-26", "Remote"],
    skipText: "No problem — I'll leave control room open.",
  },
  {
    field: "venue",
    phrasings: [
      "Where's this show based?",
      "What's the venue?",
      "Which facility or arena?",
    ],
    quickReplies: ["NHL Studios NYC", "Arena", "Remote"],
    skipText: "We can add the venue later.",
  },
  {
    field: "broadcastFeed",
    phrasings: [
      "Which feed are we watching?",
      "What's the primary monitor feed?",
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
  return "Tell me what you're building — show, date, venue, control room, feed, notes. I'll fill in the rest.";
}
