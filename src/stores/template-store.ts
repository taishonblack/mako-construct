import { supabase } from "@/integrations/supabase/client";

export interface BinderTemplate {
  id: string;
  name: string;
  createdAt: string;
  config: {
    league?: string;
    showType?: string;
    customShowType?: string;
    siteType?: string;
    partner?: string;
    isoCount?: number;
    returnRequired?: boolean;
    commercials?: string;
    customCommercials?: string;
    primaryTransport?: string;
    customPrimaryTransport?: string;
    backupTransport?: string;
    customBackupTransport?: string;
    signalNamingMode?: string;
    canonicalSignals?: string[];
    customSignalNames?: string;
    encoderInputsPerUnit?: number;
    encoderCount?: number;
    decoderOutputsPerUnit?: number;
    decoderCount?: number;
    autoAllocate?: boolean;
    timezone?: string;
    gameType?: string;
    season?: string;
    commsDefaults?: boolean;
    checklistDefaults?: boolean;
  };
}

export const templateStore = {
  async getAll(): Promise<BinderTemplate[]> {
    const { data, error } = await supabase
      .from("binder_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) { console.error("templateStore.getAll", error); return []; }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      config: (row.config || {}) as BinderTemplate["config"],
    }));
  },

  async getById(id: string): Promise<BinderTemplate | undefined> {
    const { data } = await supabase
      .from("binder_templates")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) return undefined;
    return { id: data.id, name: data.name, createdAt: data.created_at, config: (data.config || {}) as BinderTemplate["config"] };
  },

  async create(name: string, config: BinderTemplate["config"]): Promise<BinderTemplate | null> {
    const { data, error } = await supabase
      .from("binder_templates")
      .insert({ name, config })
      .select()
      .single();
    if (error) { console.error("templateStore.create", error); return null; }
    return data ? { id: data.id, name: data.name, createdAt: data.created_at, config: (data.config || {}) as BinderTemplate["config"] } : null;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("binder_templates")
      .delete()
      .eq("id", id);
    if (error) { console.error("templateStore.delete", error); return false; }
    return true;
  },
};
