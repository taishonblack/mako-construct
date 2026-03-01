import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChecklistTemplateItem {
  label: string;
  assignedTo: string;
  notes: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  createdAt: string;
  items: ChecklistTemplateItem[];
}

export const checklistTemplateStore = {
  async getAll(): Promise<ChecklistTemplate[]> {
    const { data, error } = await supabase
      .from("binder_templates")
      .select("*")
      .like("name", "checklist:%")
      .order("created_at", { ascending: false });
    if (error) { console.error("checklistTemplateStore.getAll", error); return []; }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: (row.name as string).replace(/^checklist:/, ""),
      createdAt: row.created_at,
      items: ((row.config as any)?.checklistItems || []) as ChecklistTemplateItem[],
    }));
  },

  async create(name: string, items: ChecklistTemplateItem[]): Promise<ChecklistTemplate | null> {
    const row = { name: `checklist:${name}`, config: { checklistItems: items } as any };
    const { data, error } = await supabase
      .from("binder_templates")
      .insert([row])
      .select()
      .single();
    if (error) { console.error("checklistTemplateStore.create", error); return null; }
    return data ? {
      id: data.id,
      name,
      createdAt: data.created_at,
      items: ((data.config as any)?.checklistItems || []) as ChecklistTemplateItem[],
    } : null;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("binder_templates")
      .delete()
      .eq("id", id);
    if (error) { console.error("checklistTemplateStore.delete", error); return false; }
    return true;
  },
};

export function useChecklistTemplates() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await checklistTemplateStore.getAll();
    setTemplates(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { templates, loading, refresh };
}
