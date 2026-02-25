/**
 * Binder Draft Store – localStorage persistence for Quinn conversation drafts.
 * Swappable to Supabase later.
 */

const DRAFT_KEY = "mako-quinn-binder-draft";
const CONVERSATION_KEY = "mako-quinn-conversation";

export interface BinderDraft {
  binderTitle: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  gameTime: string;
  timezone: string;
  controlRoom: string;
  venue: string;
  broadcastFeed: string;
  status: string;
  onsiteTechManager: string;
  notes: string;
  partner: string;
  isoCount: number;
  // Confidence tracking
  fieldConfidence: Record<string, "high" | "medium" | "low">;
  // Locked fields (user manually edited)
  lockedFields: string[];
}

export const EMPTY_DRAFT: BinderDraft = {
  binderTitle: "",
  homeTeam: "",
  awayTeam: "",
  gameDate: "",
  gameTime: "",
  timezone: "",
  controlRoom: "",
  venue: "",
  broadcastFeed: "",
  status: "draft",
  onsiteTechManager: "",
  notes: "",
  partner: "ESPN",
  isoCount: 12,
  fieldConfidence: {},
  lockedFields: [],
};

export interface QuinnMessage {
  id: string;
  role: "quinn" | "user";
  text: string;
  quickReplies?: string[];
  timestamp: number;
}

export const binderDraftStore = {
  getDraft(): BinderDraft {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? { ...EMPTY_DRAFT, ...JSON.parse(raw) } : { ...EMPTY_DRAFT };
    } catch { return { ...EMPTY_DRAFT }; }
  },

  saveDraft(draft: BinderDraft): void {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  },

  clearDraft(): void {
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(CONVERSATION_KEY);
  },

  getConversation(): QuinnMessage[] {
    try {
      const raw = localStorage.getItem(CONVERSATION_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  saveConversation(messages: QuinnMessage[]): void {
    localStorage.setItem(CONVERSATION_KEY, JSON.stringify(messages));
  },
};
