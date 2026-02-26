import { supabase } from "@/integrations/supabase/client";

export interface ActivityEntry {
  id: string;
  binder_id: string | null;
  timestamp: string;
  actor_type: "user" | "quinn" | "system";
  actor_name: string;
  action_type: string;
  target: string;
  target_id: string | null;
  summary: string;
  details: Record<string, any>;
  confidence: number | null;
  source: "ui" | "chat" | "import" | "api";
  undo_token: string | null;
  is_confirmed: boolean;
}

export const activityStore = {
  async log(entry: Omit<ActivityEntry, "id" | "timestamp">): Promise<void> {
    const { error } = await supabase.from("binder_activity" as any).insert(entry as any);
    if (error) console.error("Activity log failed:", error);
  },

  async logBinderUpdate(
    binderId: string,
    actorName: string,
    fieldsChanged: string[],
    before: Record<string, any>,
    after: Record<string, any>,
    source: "ui" | "chat" | "import" | "api" = "ui"
  ): Promise<void> {
    const summary = fieldsChanged.length === 1
      ? `Updated ${fieldsChanged[0]}: ${before[fieldsChanged[0]]} → ${after[fieldsChanged[0]]}`
      : `Updated ${fieldsChanged.length} fields (${fieldsChanged.join(", ")})`;

    await this.log({
      binder_id: binderId,
      actor_type: "user",
      actor_name: actorName,
      action_type: "binder_update",
      target: "binder",
      target_id: binderId,
      summary,
      details: { fields_changed: fieldsChanged, before, after },
      confidence: null,
      source,
      undo_token: null,
      is_confirmed: true,
    });
  },

  async getForBinder(binderId: string, limit = 20): Promise<ActivityEntry[]> {
    const { data, error } = await supabase
      .from("binder_activity" as any)
      .select("*")
      .eq("binder_id", binderId)
      .order("timestamp", { ascending: false })
      .limit(limit);
    if (error) { console.error("Activity fetch failed:", error); return []; }
    return (data || []) as unknown as ActivityEntry[];
  },

  async getRecent(binderId: string, hours = 24): Promise<ActivityEntry[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("binder_activity" as any)
      .select("*")
      .eq("binder_id", binderId)
      .gte("timestamp", since)
      .order("timestamp", { ascending: false });
    if (error) { console.error("Activity fetch failed:", error); return []; }
    return (data || []) as unknown as ActivityEntry[];
  },
};
