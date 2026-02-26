import { supabase } from "@/integrations/supabase/client";

export interface StaffMember {
  id: string;
  name: string;
  org: string;
  role: string;
  phone: string;
  email: string;
  notes: string;
  tags: string[];
}

function mapRow(row: any): StaffMember {
  return {
    id: row.id,
    name: row.name,
    org: row.org || "",
    role: row.role || "",
    phone: row.phone || "",
    email: row.email || "",
    notes: row.notes || "",
    tags: row.tags || [],
  };
}

export const staffStore = {
  async getAll(): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from("staff_contacts")
      .select("*")
      .order("name");
    if (error) { console.error("staffStore.getAll", error); return []; }
    return (data || []).map(mapRow);
  },

  async getById(id: string): Promise<StaffMember | undefined> {
    const { data } = await supabase
      .from("staff_contacts")
      .select("*")
      .eq("id", id)
      .single();
    return data ? mapRow(data) : undefined;
  },

  async create(member: Omit<StaffMember, "id">): Promise<StaffMember | null> {
    const { data, error } = await supabase
      .from("staff_contacts")
      .insert({
        name: member.name,
        org: member.org,
        role: member.role,
        phone: member.phone,
        email: member.email,
        notes: member.notes,
        tags: member.tags,
      })
      .select()
      .single();
    if (error) { console.error("staffStore.create", error); return null; }
    return data ? mapRow(data) : null;
  },

  async update(id: string, partial: Partial<StaffMember>): Promise<StaffMember | null> {
    const { id: _, ...patch } = partial as any;
    const { data, error } = await supabase
      .from("staff_contacts")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) { console.error("staffStore.update", error); return null; }
    return data ? mapRow(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from("staff_contacts")
      .delete()
      .eq("id", id);
    if (error) { console.error("staffStore.delete", error); return false; }
    return true;
  },

  async getByTag(tag: string): Promise<StaffMember[]> {
    const { data } = await supabase
      .from("staff_contacts")
      .select("*")
      .contains("tags", [tag])
      .order("name");
    return (data || []).map(mapRow);
  },
};
