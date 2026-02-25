/**
 * Quinn Parser – deterministic heuristics for extracting binder fields from free-text.
 * Designed to be swappable with an AI endpoint later.
 */

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ParsedField<T = string> {
  value: T;
  confidence: ConfidenceLevel;
}

export interface ParseResult {
  binderTitle?: ParsedField;
  homeTeam?: ParsedField;
  awayTeam?: ParsedField;
  gameDate?: ParsedField;
  gameTime?: ParsedField;
  timezone?: ParsedField;
  controlRoom?: ParsedField;
  venue?: ParsedField;
  broadcastFeed?: ParsedField;
  status?: ParsedField;
  onsiteTechManager?: ParsedField;
  notes?: ParsedField;
}

const NHL_TEAMS = [
  "ANA","ARI","BOS","BUF","CGY","CAR","CHI","COL","CBJ","DAL",
  "DET","EDM","FLA","LAK","MIN","MTL","NSH","NJD","NYI","NYR",
  "OTT","PHI","PIT","SJS","SEA","STL","TBL","TOR","VAN","VGK","WPG","WSH",
];

// ── Control Room ──
function parseControlRoom(text: string): ParsedField | undefined {
  const t = text.toUpperCase();
  if (/PCR[\s-]*23|CR[\s-]*23|CONTROL[\s]*23|ROOM[\s]*23/i.test(t)) {
    return { value: "23", confidence: "high" };
  }
  if (/PCR[\s-]*26|CR[\s-]*26|CONTROL[\s]*26|ROOM[\s]*26/i.test(t)) {
    return { value: "26", confidence: "high" };
  }
  if (/\bremote\b/i.test(text)) {
    return { value: "Remote", confidence: "medium" };
  }
  return undefined;
}

// ── Matchup ──
function parseMatchup(text: string): { away?: ParsedField; home?: ParsedField; title?: ParsedField } {
  // Pattern: AAA @ BBB or AAA vs BBB
  const matchup = text.match(/\b([A-Z]{2,3})\s*[@]\s*([A-Z]{2,3})\b/i)
    || text.match(/\b([A-Z]{2,3})\s+(?:vs?\.?|versus)\s+([A-Z]{2,3})\b/i);
  
  if (matchup) {
    const away = matchup[1].toUpperCase();
    const home = matchup[2].toUpperCase();
    const awayValid = NHL_TEAMS.includes(away);
    const homeValid = NHL_TEAMS.includes(home);
    if (awayValid && homeValid) {
      return {
        away: { value: away, confidence: "high" },
        home: { value: home, confidence: "high" },
        title: { value: `${away} @ ${home}`, confidence: "high" },
      };
    }
    if (awayValid || homeValid) {
      return {
        away: { value: away, confidence: awayValid ? "high" : "medium" },
        home: { value: home, confidence: homeValid ? "high" : "medium" },
        title: { value: `${away} @ ${home}`, confidence: "medium" },
      };
    }
  }

  // Fallback: look for individual team codes
  const foundTeams: string[] = [];
  for (const team of NHL_TEAMS) {
    if (new RegExp(`\\b${team}\\b`, "i").test(text)) {
      foundTeams.push(team);
    }
  }
  if (foundTeams.length >= 2) {
    return {
      away: { value: foundTeams[0], confidence: "medium" },
      home: { value: foundTeams[1], confidence: "medium" },
      title: { value: `${foundTeams[0]} @ ${foundTeams[1]}`, confidence: "medium" },
    };
  }

  // Title fallback from keywords
  const titleKeywords = text.match(/\b(Germany|International|Intl|Studios|Special|All[\s-]?Star|Winter[\s]?Classic)\b/gi);
  if (titleKeywords) {
    const label = titleKeywords[0];
    return { title: { value: label, confidence: "low" } };
  }

  return {};
}

// ── Date ──
const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};

function parseDate(text: string): ParsedField | undefined {
  // ISO: 2026-02-28
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return { value: iso[0], confidence: "high" };

  // US: 02/28/2026
  const us = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (us) {
    const d = new Date(parseInt(us[3]), parseInt(us[1]) - 1, parseInt(us[2]));
    if (!isNaN(d.getTime())) return { value: formatDate(d), confidence: "high" };
  }

  // Month Day, Year or Month Day
  const monthDay = text.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?(?:[,\s]+(\d{4}))?\b/i);
  if (monthDay) {
    const m = MONTHS[monthDay[1].toLowerCase().slice(0, 3)];
    const day = parseInt(monthDay[2]);
    const year = monthDay[3] ? parseInt(monthDay[3]) : new Date().getFullYear();
    const d = new Date(year, m, day);
    if (!isNaN(d.getTime())) return { value: formatDate(d), confidence: monthDay[3] ? "high" : "medium" };
  }

  // "today" / "tomorrow"
  const lower = text.toLowerCase();
  if (/\btoday\b/.test(lower)) return { value: formatDate(new Date()), confidence: "high" };
  if (/\btomorrow\b/.test(lower)) {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return { value: formatDate(d), confidence: "high" };
  }

  return undefined;
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Time ──
function parseTime(text: string): ParsedField | undefined {
  // 19:00 / 07:00
  const mil = text.match(/\b(\d{1,2}):(\d{2})\b/);
  if (mil) {
    const h = parseInt(mil[1]);
    if (h >= 0 && h < 24) return { value: `${String(h).padStart(2, "0")}:${mil[2]}`, confidence: "high" };
  }
  // 7pm / 7:00 PM / 7p
  const ampm = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)\b/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = ampm[2] ? parseInt(ampm[2]) : 0;
    const isPm = /p/i.test(ampm[3]);
    if (isPm && h < 12) h += 12;
    if (!isPm && h === 12) h = 0;
    return { value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, confidence: "high" };
  }
  return undefined;
}

// ── Timezone ──
function parseTimezone(text: string): ParsedField | undefined {
  if (/\b(ET|Eastern)\b/i.test(text)) return { value: "America/New_York", confidence: "high" };
  if (/\b(CT|Central)\b/i.test(text)) return { value: "America/Chicago", confidence: "high" };
  if (/\b(MT|Mountain)\b/i.test(text)) return { value: "America/Denver", confidence: "high" };
  if (/\b(PT|Pacific)\b/i.test(text)) return { value: "America/Los_Angeles", confidence: "high" };
  if (/\bCET\b/i.test(text)) return { value: "Europe/Berlin", confidence: "high" };
  return undefined;
}

// ── Venue ──
function parseVenue(text: string): ParsedField | undefined {
  if (/nhl\s*studios?\b/i.test(text)) return { value: "NHL Studios NYC", confidence: "high" };
  if (/\barena\b/i.test(text)) return { value: "Arena", confidence: "low" };
  // Known arenas (sample)
  const arenas: Record<string, string> = {
    "td garden": "TD Garden",
    "msg": "Madison Square Garden",
    "madison square garden": "Madison Square Garden",
    "bell centre": "Bell Centre",
    "scotiabank arena": "Scotiabank Arena",
  };
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(arenas)) {
    if (lower.includes(key)) return { value: val, confidence: "high" };
  }
  return undefined;
}

// ── Feed ──
function parseFeed(text: string): ParsedField | undefined {
  const feeds = ["ESPN", "ESPN2", "SportsNet", "TNT", "World Feed", "ABC"];
  for (const f of feeds) {
    if (new RegExp(`\\b${f.replace(/\s/g, "\\s*")}\\b`, "i").test(text)) {
      return { value: f, confidence: "high" };
    }
  }
  if (/\bhost\s*feed\b/i.test(text)) return { value: "Host Feed", confidence: "medium" };
  return undefined;
}

// ── Main parse function ──
export function parseQuinnInput(text: string): ParseResult {
  const result: ParseResult = {};

  const matchup = parseMatchup(text);
  if (matchup.away) result.awayTeam = matchup.away;
  if (matchup.home) result.homeTeam = matchup.home;
  if (matchup.title) result.binderTitle = matchup.title;

  const date = parseDate(text);
  if (date) result.gameDate = date;

  const time = parseTime(text);
  if (time) result.gameTime = time;

  const tz = parseTimezone(text);
  if (tz) result.timezone = tz;

  const cr = parseControlRoom(text);
  if (cr) result.controlRoom = cr;

  const venue = parseVenue(text);
  if (venue) result.venue = venue;

  const feed = parseFeed(text);
  if (feed) result.broadcastFeed = feed;

  return result;
}

/** Get fields that are still missing from a draft */
export type QuinnField = "identity" | "gameDate" | "gameTime" | "timezone" | "controlRoom" | "venue" | "broadcastFeed" | "status";

export function getMissingFields(draft: Record<string, any>): QuinnField[] {
  const missing: QuinnField[] = [];
  if (!draft.binderTitle && (!draft.homeTeam || !draft.awayTeam)) missing.push("identity");
  if (!draft.gameDate) missing.push("gameDate");
  if (!draft.gameTime) missing.push("gameTime");
  if (!draft.timezone) missing.push("timezone");
  if (!draft.controlRoom) missing.push("controlRoom");
  if (!draft.venue) missing.push("venue");
  if (!draft.broadcastFeed) missing.push("broadcastFeed");
  return missing;
}
