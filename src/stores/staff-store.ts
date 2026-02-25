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

// Seed data for NYR @ BOS binder
const SEED_STAFF: Omit<StaffMember, "id">[] = [
  { name: "Mike Torres", org: "MAKO", role: "Tech Manager", phone: "+1-617-555-0101", email: "mike.torres@mako.tv", notes: "Primary TM for TD Garden builds", tags: ["NHL", "Truck"] },
  { name: "Sarah Kim", org: "MAKO", role: "Lead Engineer", phone: "+1-617-555-0102", email: "sarah.kim@mako.tv", notes: "Encoder/decoder specialist", tags: ["NHL", "Truck"] },
  { name: "Dave Kowalski", org: "MAKO", role: "Audio A1", phone: "+1-617-555-0103", email: "dave.k@mako.tv", notes: "", tags: ["NHL", "Truck"] },
  { name: "Jenna Reyes", org: "TNT Sports", role: "Producer", phone: "+1-212-555-0201", email: "jenna.reyes@tnt.com", notes: "TNT game producer — NYR home games", tags: ["Partner"] },
  { name: "Chris Okafor", org: "TNT Sports", role: "Director", phone: "+1-212-555-0202", email: "chris.okafor@tnt.com", notes: "", tags: ["Partner"] },
  { name: "Alex Nguyen", org: "MAKO", role: "Transmission Engineer", phone: "+1-617-555-0104", email: "alex.n@mako.tv", notes: "SRT / RIST transport lead", tags: ["NHL", "Transmission"] },
  { name: "Pat Sullivan", org: "TD Garden", role: "Venue Tech", phone: "+1-617-555-0301", email: "pat.sullivan@tdgarden.com", notes: "Venue fiber and patch panel contact", tags: ["Vendor"] },
  { name: "Robin Tanaka", org: "Haivision", role: "Field Support", phone: "+1-514-555-0401", email: "robin.t@haivision.com", notes: "On-call for Makito X4 issues", tags: ["Vendor"] },
  { name: "Marcus Cole", org: "MAKO", role: "Graphics Operator", phone: "+1-617-555-0105", email: "marcus.cole@mako.tv", notes: "", tags: ["NHL", "Truck"] },
  { name: "Lisa Park", org: "Evertz", role: "Router Support", phone: "+1-905-555-0501", email: "lisa.park@evertz.com", notes: "EQX 32x32 support contact", tags: ["Vendor"] },
];

export const staffStore = {
  async getAll(): Promise<StaffMember[]> {
    const { data, error } = await supabase
      .from("staff_contacts")
      .select("*")
      .order("name");
    if (error) { console.error("staffStore.getAll", error); return []; }
    const rows = (data || []).map(mapRow);
    // Seed if empty
    if (rows.length === 0) {
      for (const s of SEED_STAFF) {
        await supabase.from("staff_contacts").insert({
          name: s.name, org: s.org, role: s.role, phone: s.phone,
          email: s.email, notes: s.notes, tags: s.tags,
        });
      }
      const { data: seeded } = await supabase.from("staff_contacts").select("*").order("name");
      return (seeded || []).map(mapRow);
    }
    return rows;
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
