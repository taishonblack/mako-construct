import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  access: "admin" | "editor" | "viewer";
}

function mapRow(row: any): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role || "",
    access: (row.access as TeamMember["access"]) || "editor",
  };
}

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() { listeners.forEach((fn) => fn()); }

export const teamStore = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },

  async getAll(): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("name");
    if (error) { console.error("teamStore.getAll", error); return []; }
    return (data || []).map(mapRow);
  },

  async create(member: Omit<TeamMember, "id">): Promise<TeamMember | null> {
    const { data, error } = await supabase
      .from("team_members")
      .insert({ name: member.name, role: member.role, access: member.access })
      .select()
      .single();
    if (error) { console.error("teamStore.create", error); return null; }
    emit();
    return data ? mapRow(data) : null;
  },

  async update(id: string, partial: Partial<TeamMember>): Promise<TeamMember | null> {
    const { id: _, ...patch } = partial as any;
    const { data, error } = await supabase
      .from("team_members")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) { console.error("teamStore.update", error); return null; }
    emit();
    return data ? mapRow(data) : null;
  },

  async remove(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", id);
    if (error) { console.error("teamStore.remove", error); return false; }
    emit();
    return true;
  },
};
