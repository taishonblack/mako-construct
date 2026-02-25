import { supabase } from "@/integrations/supabase/client";

export type BinderStatus = "draft" | "active" | "completed" | "archived";

export interface ReturnFeedEndpoint {
  id: string;
  sourcePartner: string;
  type: string;
  host: string;
  port: string;
  mode: string;
  notes: string;
}

export interface DeviceLine {
  id: string;
  brand: string;
  model: string;
  outputsPerUnit: number;
  unitCount: number;
  notes: string;
}

export interface LQPort {
  letter: string;
  label: string;
  notes: string;
}

export interface BinderRecord {
  id: string;
  title: string;
  partner: string;
  venue: string;
  eventDate: string;
  status: BinderStatus;
  isoCount: number;
  openIssues: number;
  transport: string;
  updatedAt: string;
  league: string;
  containerId: string;
  showType: string;
  returnRequired: boolean;
  commercials: string;
  primaryTransport: string;
  backupTransport: string;
  notes: string;
  eventTime: string;
  timezone: string;
  homeTeam: string;
  awayTeam: string;
  siteType: string;
  studioLocation: string;
  customShowType: string;
  customPrimaryTransport: string;
  customBackupTransport: string;
  customCommercials: string;
  signalNamingMode: string;
  canonicalSignals: string[];
  customSignalNames: string;
  encoderInputsPerUnit: number;
  encoderCount: number;
  decoderOutputsPerUnit: number;
  decoderCount: number;
  autoAllocate: boolean;
  gameType: string;
  season: string;
  controlRoom: string;
  rehearsalDate: string;
  broadcastFeed: string;
  onsiteTechManager: string;
  returnFeedEndpoints: ReturnFeedEndpoint[];
  encoders: DeviceLine[];
  decoders: DeviceLine[];
  outboundHost: string;
  outboundPort: string;
  inboundHost: string;
  inboundPort: string;
  lqRequired: boolean;
  lqPorts: LQPort[];
}

const DEFAULT_CONFIG = {
  showType: "Standard",
  returnRequired: false,
  commercials: "local-insert",
  primaryTransport: "SRT",
  backupTransport: "MPEG-TS",
  notes: "",
  eventTime: "19:00",
  timezone: "America/New_York",
  homeTeam: "",
  awayTeam: "",
  siteType: "Arena",
  studioLocation: "",
  customShowType: "",
  customPrimaryTransport: "",
  customBackupTransport: "",
  customCommercials: "",
  signalNamingMode: "iso",
  canonicalSignals: [],
  customSignalNames: "",
  encoderInputsPerUnit: 2,
  encoderCount: 6,
  decoderOutputsPerUnit: 4,
  decoderCount: 6,
  autoAllocate: true,
  gameType: "Regular Season",
  season: "2025–26",
  controlRoom: "23",
  rehearsalDate: "",
  broadcastFeed: "",
  onsiteTechManager: "",
  returnFeedEndpoints: [],
  encoders: [{ id: "enc-1", brand: "Videon", model: "", outputsPerUnit: 4, unitCount: 2, notes: "" }],
  decoders: [{ id: "dec-1", brand: "Haivision", model: "", outputsPerUnit: 2, unitCount: 6, notes: "" }],
  outboundHost: "",
  outboundPort: "",
  inboundHost: "",
  inboundPort: "",
  lqRequired: false,
  lqPorts: [
    { letter: "E", label: "Truck AD", notes: "" },
    { letter: "F", label: "Truck Production", notes: "" },
    { letter: "G", label: "Cam Ops", notes: "" },
    { letter: "H", label: "TBD", notes: "" },
  ],
};

function mapRow(row: any): BinderRecord {
  const config = row.config || {};
  return {
    id: row.id,
    title: row.title,
    partner: row.partner || "",
    venue: row.venue || "",
    eventDate: row.event_date || "",
    status: (row.status as BinderStatus) || "draft",
    isoCount: row.iso_count || 12,
    openIssues: row.open_issues || 0,
    transport: row.transport || "SRT",
    updatedAt: row.updated_at,
    league: row.league || "NHL",
    containerId: row.container_id || "",
    ...DEFAULT_CONFIG,
    ...config,
  };
}

function toDbRow(record: Partial<BinderRecord>) {
  const { id, title, partner, venue, eventDate, status, isoCount, openIssues, transport, league, containerId, updatedAt, ...config } = record as any;
  const row: any = {};
  if (title !== undefined) row.title = title;
  if (partner !== undefined) row.partner = partner;
  if (venue !== undefined) row.venue = venue;
  if (eventDate !== undefined) row.event_date = eventDate;
  if (status !== undefined) row.status = status;
  if (isoCount !== undefined) row.iso_count = isoCount;
  if (openIssues !== undefined) row.open_issues = openIssues;
  if (transport !== undefined) row.transport = transport;
  if (league !== undefined) row.league = league;
  if (containerId !== undefined) row.container_id = containerId;
  if (Object.keys(config).length > 0) row.config = config;
  return row;
}

export const binderStore = {
  async getAll(): Promise<BinderRecord[]> {
    const { data, error } = await supabase
      .from("binders")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) { console.error("binderStore.getAll", error); return []; }
    return (data || []).map(mapRow);
  },

  async getById(id: string): Promise<BinderRecord | undefined> {
    const { data } = await supabase
      .from("binders")
      .select("*")
      .eq("id", id)
      .single();
    return data ? mapRow(data) : undefined;
  },

  async create(record: Omit<BinderRecord, "id" | "updatedAt">): Promise<BinderRecord | null> {
    const dbRow = toDbRow(record);
    const { data, error } = await supabase
      .from("binders")
      .insert(dbRow)
      .select()
      .single();
    if (error) { console.error("binderStore.create", error); return null; }
    return data ? mapRow(data) : null;
  },

  async update(id: string, partial: Partial<BinderRecord>): Promise<BinderRecord | null> {
    // Need to merge config: read existing first
    const { data: existing } = await supabase.from("binders").select("config").eq("id", id).single();
    const existingConfig = existing?.config || {};
    
    const dbRow = toDbRow(partial);
    if (dbRow.config) {
      dbRow.config = { ...existingConfig, ...dbRow.config };
    }
    
    const { data, error } = await supabase
      .from("binders")
      .update(dbRow)
      .eq("id", id)
      .select()
      .single();
    if (error) { console.error("binderStore.update", error); return null; }
    return data ? mapRow(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("binders")
      .delete()
      .eq("id", id);
    if (error) { console.error("binderStore.delete", error); return false; }
    return true;
  },
};
